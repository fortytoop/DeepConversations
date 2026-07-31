import json
import os
import re
from typing import List, Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()


if not (openai_api_key := os.getenv("OPENAI_API_KEY")):
    raise RuntimeError("OPENAI_API_KEY is not configured")

client = OpenAI(api_key=openai_api_key)


app = FastAPI()

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


QUESTIONS_PER_BATCH = 3
MAX_GENERATE_CLICKS = 2
# The first generation happens automatically, hence + 1
# # Default MAX_TOTAL_QUESTIONS = 9
MAX_TOTAL_QUESTIONS = QUESTIONS_PER_BATCH * (MAX_GENERATE_CLICKS + 1)


class QuestionRequest(BaseModel):
    question: str
    mode: Optional[str] = "deepdive"
    previousQuestions: List[str] = Field(default_factory=list)


@app.get("/")
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
def create_question_response(request: QuestionRequest):
    original_conversation_question = request.question.strip()
    previous_follow_up_questions = [
        previous_question
        for question in request.previousQuestions
        if (previous_question := clean_question(question))
    ]

    if not original_conversation_question:
        raise HTTPException(status_code=400, detail="Conversation question is required")

    # Implementation of other modes not done, stop request for now
    if request.mode != "deepdive":
        raise HTTPException(status_code=400, detail="Only deepdive mode is supported")

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

        response = client.responses.create(
            model="gpt-5.6-luna",
            store=False,
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
                - Keep each question succinct.
                - Return this exact JSON shape:
                {{"questions": ["question 1", "question 2", "question 3"]}}
            """,
        )

        questions = remove_similar_questions(
            parse_questions(response.output_text),
            previous_follow_up_questions,
        )[:QUESTIONS_PER_BATCH]

        if not questions:
            raise HTTPException(
                status_code=502,
                detail="Spark did not return any new questions",
            )

        return {
            "questions": questions,
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
