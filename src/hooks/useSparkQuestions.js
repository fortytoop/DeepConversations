import { useState } from "react";
import { SPARK_CLOSE_ANIMATION_MS } from "../constants";

// Controls the Spark panel, including opening/closing, loading,
// generated questions, pagination, and backend generation limits
export function useSparkQuestions(currentCard) {
  const [isPressed, setIsPressed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // These come from the backend
  const [remainingGenerations, setRemainingGenerations] = useState(0);
  const [maxTotalQuestions, setMaxTotalQuestions] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canGenerateMoreQuestions = remainingGenerations > 0;

  // Generate Spark questions for the current card
  // When replace is true, start a fresh Spark session instead of appending questions
  async function generate({ replace = false } = {}) {
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
      const response = await fetch("/api/spark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "deepdive",
          question: currentCard.question,
          previousQuestions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Spark backend error:", response.status, errorText);
        throw new Error(errorText);
      }

      const data = await response.json();
      const newQuestions = Array.isArray(data.questions) ? data.questions : [];

      if (newQuestions.length === 0) {
        throw new Error("Spark returned no new deep dive questions.");
      }

      // Insert the newly generated question first
      const insertionIndex = replace ? 0 : previousQuestions.length;

      setQuestions((existingQuestions) =>
        replace ? newQuestions : [...existingQuestions, ...newQuestions],
      );
      setQuestionIndex(insertionIndex);
      setRemainingGenerations(Number(data.remainingGenerations) || 0);
      setMaxTotalQuestions(
        Number.isFinite(Number(data.maxTotalQuestions))
          ? Number(data.maxTotalQuestions)
          : null,
      );
    } catch (sparkError) {
      console.error("Spark failed:", sparkError);
      setError("Sorry, Spark could not generate new questions right now.");
    } finally {
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

    setIsPressed(true);

    if (isOpen) {
      close();
      return;
    }

    setIsOpen(true);
    generate({ replace: true });
  }

  function handleAnimationEnd() {
    setIsPressed(false);
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
    handleAnimationEnd,
    handleClick,
    isClosing,
    isOpen,
    isPressed,
    loading,
    maxTotalQuestions,
    questionIndex,
    questions,
    remainingGenerations,
  };
}
