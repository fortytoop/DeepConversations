import { useState } from "react";
import questions from "../../backend/questions.json";
import AnimatingBackground from "../components/AnimatingBackground";
import CardArea from "../components/CardArea";
import CategoryControls from "../components/CategoryControls";
import Hero from "../components/Hero";
import SparkPanel from "../components/SparkPanel";
import Footer from "../components/Footer";
import { useQuestionDeck } from "../hooks/useQuestionDeck";
import { useSparkQuestions } from "../hooks/useSparkQuestions";

function getSparkStatusMessage(spark) {
  if (!spark.isOpen || spark.isClosing || spark.error) return "";

  if (spark.loading) {
    return spark.questions.length > 0
      ? "Generating more follow-up questions."
      : "Generating follow-up questions.";
  }

  const currentQuestion = spark.questions[spark.questionIndex];
  if (!currentQuestion) return "";

  const limitMessage = spark.canGenerateMoreQuestions
    ? ""
    : " Question limit reached.";

  return `Follow-up question ${spark.questionIndex + 1} of ${spark.questions.length}: ${currentQuestion}${limitMessage}`;
}

export default function HomePage({ theme }) {
  const [sparkButtonPosition, setSparkButtonPosition] = useState(null);
  const deck = useQuestionDeck(questions);
  const spark = useSparkQuestions(deck.currentCard);

  function handleSparkClick(event) {
    const buttonBounds = event.currentTarget.getBoundingClientRect();
    setSparkButtonPosition({
      x: buttonBounds.left + buttonBounds.width / 2,
      y: buttonBounds.top + buttonBounds.height / 2,
    });
    spark.handleClick();
  }

  function goToNextCard() {
    spark.close();
    deck.goToNextCard();
  }

  function goToPreviousCard() {
    spark.close();
    deck.goToPreviousCard();
  }

  function goToNextCategory() {
    spark.close();
    deck.goToNextCategory();
  }

  function goToPreviousCategory() {
    spark.close();
    deck.goToPreviousCategory();
  }

  return (
    <>
      <AnimatingBackground theme={theme} />

      <main className="app">
        <p className="visually-hidden" role="status" aria-atomic="true">
          {getSparkStatusMessage(spark)}
        </p>

        <Hero />

        <CategoryControls
          category={deck.category}
          categoryCount={deck.categoryCount}
          categoryAnimation={deck.categoryAnimation}
          categoryNumber={deck.categoryNumber}
          pressedCategoryDirection={deck.pressedCategoryDirection}
          previousCategory={deck.previousCategory}
          previousCategoryNumber={deck.previousCategoryNumber}
          onNextCategory={goToNextCategory}
          onPreviousCategory={goToPreviousCategory}
        />

        {deck.currentCard && (
          <CardArea
            cardNumber={deck.cardNumber}
            categoryAnimation={deck.categoryAnimation}
            isShuffled={deck.isShuffled}
            isSparkOpen={spark.isOpen && !spark.isClosing}
            previousCategoryCardNumber={deck.previousCategoryCardNumber}
            previousCategoryCards={deck.previousCategoryCards}
            pressedCardDirection={deck.pressedCardDirection}
            shufflePressed={deck.shufflePressed}
            stackAnimation={deck.stackAnimation}
            visibleCards={deck.visibleCards}
            onNextCard={goToNextCard}
            onPreviousCard={goToPreviousCard}
            onShuffleClick={deck.handleShuffleClick}
            onSparkClick={handleSparkClick}
          />
        )}

        {spark.isOpen && (
          <SparkPanel
            spark={spark}
            sparkButtonPosition={sparkButtonPosition}
          />
        )}

        <Footer />
      </main>
    </>
  );
}
