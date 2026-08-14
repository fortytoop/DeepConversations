import { useRef, useState } from "react";
import { SPARK_CLOSE_ANIMATION_MS } from "../constants";
import { readSparkCache, writeSparkCache } from "../utils/sparkCache";
import { parseSparkResponse } from "../utils/sparkData";

// Test dropped connection
const SIMULATE_SPARK_AI_FAILURE =
  import.meta.env.DEV &&
  import.meta.env.VITE_SIMULATE_SPARK_AI_FAILURE === "true";

function parseRateLimitError(data) {
  if (typeof data?.error !== "string") return "";

  const message = data.error.startsWith("Rate limit exceeded: ")
    ? data.error.slice("Rate limit exceeded: ".length).trim()
    : "";

  return message.length <= 200 ? message : "";
}

class SparkApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "SparkApiError";
    this.status = status;
  }
}

// Controls the Spark panel, including opening/closing, loading,
// generated questions, pagination, and backend generation limits
export function useSparkQuestions(currentCard) {
  const requestInProgressRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // These come from the backend
  const [remainingGenerations, setRemainingGenerations] = useState(0);
  const [maxTotalQuestions, setMaxTotalQuestions] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Until the backend returns limit metadata, the quota is unknown rather
  // than exhausted. This also keeps retrying available after network errors.
  const hasReachedGenerationLimit =
    maxTotalQuestions !== null && remainingGenerations <= 0;
  const canGenerateMoreQuestions = !hasReachedGenerationLimit;

  // Generate Spark questions for the current card
  // When replace is true, start a fresh Spark session instead of appending questions
  async function generate({ replace = false } = {}) {
    if (requestInProgressRef.current) return;

    if (!currentCard?.question) {
      setError("No question found for this card.");
      return;
    }

    if (!replace && !canGenerateMoreQuestions) {
      setError("You've reached the question limit for this card.");
      return;
    }

    // Send existing questions so the backend
    const previousQuestions = replace ? [] : questions;

    requestInProgressRef.current = true;
    setLoading(true);
    setError("");

    // Reset local Spark state before starting a fresh generation
    if (replace) {
      setQuestions([]);
      setQuestionIndex(0);
      setRemainingGenerations(0);
      setMaxTotalQuestions(null);
    }

    try {
      if (SIMULATE_SPARK_AI_FAILURE) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        throw new Error("Testing connection dropped");
      }

      const response = await fetch("/api/spark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "deepdive",
          cardId: currentCard.id,
          previousQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Spark AI backend error:", response.status, errorData);
        throw new SparkApiError(
          response.status,
          response.status === 429 ? parseRateLimitError(errorData) : "",
        );
      }

      const data = await response.json();
      const parsedData = parseSparkResponse(data, previousQuestions.length);
      if (!parsedData) throw new Error("Spark AI returned invalid question data.");

      // Insert the newly generated question first
      const insertionIndex = replace ? 0 : previousQuestions.length;
      const updatedQuestions = replace
        ? parsedData.questions
        : [...previousQuestions, ...parsedData.questions];

      setQuestions(updatedQuestions);
      setQuestionIndex(insertionIndex);
      setRemainingGenerations(parsedData.remainingGenerations);
      setMaxTotalQuestions(parsedData.maxTotalQuestions);
      writeSparkCache(currentCard, {
        questions: updatedQuestions,
        questionsPerBatch: parsedData.questionsPerBatch,
        remainingGenerations: parsedData.remainingGenerations,
        maxTotalQuestions: parsedData.maxTotalQuestions,
      });
    } catch (sparkError) {
      console.error("Spark AI failed:", sparkError);
      setError(
        sparkError instanceof SparkApiError && sparkError.status === 429
          ? sparkError.message ||
              "Spark has received too many requests. Please wait a moment and try again."
          : "Couldn’t generate more questions. Check your connection and try again.",
      );
    } finally {
      requestInProgressRef.current = false;
      setLoading(false);
    }
  }

  function close() {
    if (!isOpen) return;

    setIsClosing(true);

    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setQuestions([]);
      setQuestionIndex(0);
      setLoading(false);
      setError("");
      setRemainingGenerations(0);
      setMaxTotalQuestions(null);
    }, SPARK_CLOSE_ANIMATION_MS);
  }

  // Clicking Spark either closes the panel or opens it and generates new questions
  function handleClick() {
    if (!currentCard?.question) {
      setError("No question found for this card.");
      return;
    }

    if (isOpen) {
      close();
      return;
    }

    const cachedSpark = readSparkCache(currentCard);

    setIsOpen(true);
    setError("");

    if (cachedSpark) {
      setQuestions(cachedSpark.questions);
      setQuestionIndex(0);
      setRemainingGenerations(cachedSpark.remainingGenerations);
      setMaxTotalQuestions(cachedSpark.maxTotalQuestions);
      return;
    }

    generate({ replace: true });
  }

  function goToPreviousQuestion() {
    setQuestionIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  }

  function goToNextQuestion() {
    setQuestionIndex((previousIndex) =>
      Math.min(previousIndex + 1, questions.length - 1),
    );
  }

  return {
    canGenerateMoreQuestions,
    close,
    error,
    generate,
    goToNextQuestion,
    goToPreviousQuestion,
    handleClick,
    isClosing,
    isOpen,
    loading,
    maxTotalQuestions,
    questionIndex,
    questions,
    remainingGenerations,
  };
}
