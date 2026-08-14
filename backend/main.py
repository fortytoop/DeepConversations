import json
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, List, Literal

import numpy as np
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field, StringConstraints
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

if not (openai_api_key := os.getenv("OPENAI_API_KEY")):
    raise RuntimeError("OPENAI_API_KEY is not configured")

client = OpenAI(api_key=openai_api_key)


QUESTIONS_PER_BATCH = 3
MAX_GENERATE_CLICKS = 2
# The first generation happens automatically, hence + 1
# Default MAX_TOTAL_QUESTIONS = 9
MAX_TOTAL_QUESTIONS = QUESTIONS_PER_BATCH * (MAX_GENERATE_CLICKS + 1)
MAX_ORIGINAL_QUESTION_LENGTH = 500
MAX_FOLLOW_UP_QUESTION_LENGTH = 300


limiter = Limiter(
    key_func=get_remote_address,
    headers_enabled=True,
)

FollowUpQuestion = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=MAX_FOLLOW_UP_QUESTION_LENGTH,
    ),
]


class QuestionRequest(BaseModel):
    cardId: int = Field(ge=0, strict=True)
    mode: Literal["deepdive"] = "deepdive"
    previousQuestions: List[FollowUpQuestion] = Field(
        default_factory=list,
        max_length=MAX_TOTAL_QUESTIONS,
    )


def load_conversation_questions() -> dict[int, str]:
    questions_path = Path(__file__).with_name("questions.json")

    try:
        with questions_path.open(encoding="utf-8") as questions_file:
            question_cards = json.load(questions_file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Could not load the conversation questions") from error

    if not isinstance(question_cards, list):
        raise RuntimeError("Conversation questions must be a JSON array")

    questions_by_id: dict[int, str] = {}

    for card in question_cards:
        if not isinstance(card, dict):
            raise RuntimeError("Every conversation card must be a JSON object")

        card_id = card.get("id")
        question = card.get("question")

        if (
            not isinstance(card_id, int)
            or isinstance(card_id, bool)
            or card_id < 0
            or card_id in questions_by_id
            or not isinstance(question, str)
            or not (cleaned_question := question.strip())
            or len(cleaned_question) > MAX_ORIGINAL_QUESTION_LENGTH
        ):
            raise RuntimeError("Conversation question data is invalid")

        questions_by_id[card_id] = cleaned_question

    if not questions_by_id:
        raise RuntimeError("No conversation questions were found")

    return questions_by_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.conversation_questions = load_conversation_questions()
    yield


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conversation_questions(request: Request) -> dict[int, str]:
    return request.app.state.conversation_questions


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def clean_question(question: str) -> str:
    """Remove whitespace and leading list markers."""
    cleaned_question = question.strip()
    cleaned_question = re.sub(
        r"^\s*[-*\u2022]\s*", "", cleaned_question
    )  # bullet points (-, *, •)
    cleaned_question = re.sub(r"^\s*\d+[.)]\s*", "", cleaned_question)  # numbered list
    return cleaned_question.strip()


def parse_questions(output_text: str) -> List[str]:
    """Parse and clean questions from JSON or newline-separated text if failed."""
    text = output_text.strip()

    # Split questions assuming valid JSON
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            parsed = parsed.get("questions", [])
        if isinstance(parsed, list):
            return [
                clean_item
                for item in parsed
                if isinstance(item, str)
                if (clean_item := clean_question(item))
            ]
    except json.JSONDecodeError:
        pass

    # Manual question splitting
    return [
        clean_item for item in text.splitlines() if (clean_item := clean_question(item))
    ]


def get_question_embeddings(questions: List[str]) -> List[List[float]]:
    if not questions:
        return []

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=questions,
    )

    return [item.embedding for item in response.data]


def is_similar_to_any(
    question_embedding: list[float],
    previous_embeddings: list[list[float]],
    similarity_threshold: float,
) -> bool:
    """
    Check whether a question embedding is too similar to any previous embedding.

    Returns True when at least one cosine similarity score meets or exceeds the
    predefined similarity_threshold.
    """
    if not previous_embeddings:
        return False

    question_vector = np.array(question_embedding)
    previous_matrix = np.array(previous_embeddings)

    question_norm = np.linalg.norm(question_vector)
    previous_norms = np.linalg.norm(previous_matrix, axis=1)

    if question_norm == 0:
        return False

    # Mask embeddings with 0
    valid_previous = previous_norms != 0
    if not np.any(valid_previous):
        return False

    dot_product = previous_matrix[valid_previous] @ question_vector  # a•b
    product_of_magnitudes = previous_norms[valid_previous] * question_norm  #||a||*||b||

    cosine_similarities = dot_product / product_of_magnitudes

    return bool(np.any(cosine_similarities >= similarity_threshold))


def remove_similar_questions(
    new_questions: list[str],
    previous_questions: list[str],
    similarity_threshold: float = 0.9,
) -> list[str]:
    """
    Remove questions that are exact duplicates or closely paraphrases
    previously generated questions.

    The similarity_threshold controls how strict the paraphrase filter is.
    """

    used_questions = {question.strip().casefold() for question in previous_questions}
    unique_questions = []

    # Combine to only use one API call
    all_questions = previous_questions + new_questions
    embeddings = get_question_embeddings(all_questions)

    previous_embeddings = embeddings[: len(previous_questions)]
    new_embeddings = embeddings[len(previous_questions) :]

    for question, question_embedding in zip(new_questions, new_embeddings):
        normalised_question = question.strip().casefold()

        if not normalised_question:
            continue

        if normalised_question in used_questions:
            continue

        if is_similar_to_any(
            question_embedding, previous_embeddings, similarity_threshold
        ):
            continue

        used_questions.add(normalised_question)
        unique_questions.append(question)
        # Compare later new questions against earlier accepted ones
        previous_embeddings.append(question_embedding)

    return unique_questions


@app.post("/api/spark")
@limiter.limit(
    "6/minute",
    error_message=(
        "Spark AI has received too many requests. Please wait a minute and try again."
    ),
)
@limiter.limit(
    "30/hour",
    error_message=(
        "Spark AI has received too many requests. Please come back later and try again."
    ),
)
def create_question_response(
    request: Request,
    response: Response,
    spark_request: QuestionRequest,
    conversation_questions: Annotated[
        dict[int, str], Depends(get_conversation_questions)
    ],
):
    original_conversation_question = conversation_questions.get(spark_request.cardId)
    if original_conversation_question is None:
        raise HTTPException(status_code=400, detail="Unknown conversation card")

    previous_follow_up_questions = [
        previous_question
        for question in spark_request.previousQuestions
        if (previous_question := clean_question(question))
    ]

    if len(previous_follow_up_questions) >= MAX_TOTAL_QUESTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Spark is limited to {MAX_TOTAL_QUESTIONS} questions per card",
        )

    # Refuse a new generation if adding a new batch would exceed the limit of MAX_TOTAL_QUESTIONS
    # For edge cases where duplicate questions have been removed
    if len(previous_follow_up_questions) + QUESTIONS_PER_BATCH > MAX_TOTAL_QUESTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Spark is limited to {MAX_TOTAL_QUESTIONS} questions per card",
        )

    try:
        previous_follow_up_questions_text = (
            "\n".join(f"- {question}" for question in previous_follow_up_questions)
            if previous_follow_up_questions
            else "None yet."
        )

        openai_response = client.responses.create(
            model="gpt-5.6-luna",
            store=False,
            temperature=1.0,
            instructions="""
                You are Spark, a warm conversation assistant for couples.
                Help users explore relationship questions thoughtfully.
                Keep responses kind, concise, emotionally safe, and practical.
                Do not sound clinical.
                Return only valid JSON. No markdown, no commentary.
            """,
            input=f"""
                Original conversation question:
                {original_conversation_question}

                Already generated follow-up questions:
                {previous_follow_up_questions_text}

                Generate exactly {QUESTIONS_PER_BATCH} new deep-dive follow-up questions.

                Rules:
                - Do not repeat or closely paraphrase any already generated question.
                - Stay connected to the original conversation question.
                - Make each question emotionally specific and natural to ask out loud.
                - Keep each question succinct, under {MAX_FOLLOW_UP_QUESTION_LENGTH} characters long.
                - Return this exact JSON shape:
                {{"questions": ["question 1", "question 2", "question 3"]}}
            """,
        )

        valid_generated_questions = [
            question
            for question in parse_questions(openai_response.output_text)
            if len(question) <= MAX_FOLLOW_UP_QUESTION_LENGTH
        ]

        questions = remove_similar_questions(
            valid_generated_questions,
            previous_follow_up_questions,
        )[:QUESTIONS_PER_BATCH]

        if not questions:
            raise HTTPException(
                status_code=502,
                detail="Spark did not return any new questions",
            )

        return {
            "questions": questions,
            "questionsPerBatch": QUESTIONS_PER_BATCH,
            "remainingGenerations": max(
                (
                    MAX_TOTAL_QUESTIONS
                    - len(previous_follow_up_questions)
                    - len(questions)
                )
                // QUESTIONS_PER_BATCH,
                0,
            ),
            "maxTotalQuestions": MAX_TOTAL_QUESTIONS,
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
