import questions from "../data/questions.json";
import AnimatingBackground from "../components/AnimatingBackground";
import CardArea from "../components/CardArea";
import CategoryControls from "../components/CategoryControls";
import Hero from "../components/Hero";
import SparkPanel from "../components/SparkPanel";
import Footer from "../components/Footer";
import { useQuestionDeck } from "../hooks/useQuestionDeck";
import { useSparkQuestions } from "../hooks/useSparkQuestions";

export default function HomePage() {
  const deck = useQuestionDeck(questions);
  const spark = useSparkQuestions(deck.currentCard);

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
      <AnimatingBackground />

      <main className="app">
        <Hero />

        <CategoryControls
          category={deck.category}
          categoryAnimation={deck.categoryAnimation}
          pressedCategoryDirection={deck.pressedCategoryDirection}
          previousCategory={deck.previousCategory}
          onNextCategory={goToNextCategory}
          onPreviousCategory={goToPreviousCategory}
        />

        {deck.currentCard && (
          <CardArea
            cardNumber={deck.cardNumber}
            categoryAnimation={deck.categoryAnimation}
            isShuffled={deck.isShuffled}
            isSparkOpen={spark.isOpen}
            isSparkPressed={spark.isPressed}
            previousCategoryCardNumber={deck.previousCategoryCardNumber}
            previousCategoryCards={deck.previousCategoryCards}
            pressedCardDirection={deck.pressedCardDirection}
            shufflePressed={deck.shufflePressed}
            stackAnimation={deck.stackAnimation}
            visibleCards={deck.visibleCards}
            onNextCard={goToNextCard}
            onPreviousCard={goToPreviousCard}
            onShuffleClick={deck.handleShuffleClick}
            onSparkAnimationEnd={spark.handleAnimationEnd}
            onSparkClick={spark.handleClick}
          />
        )}

        {spark.isOpen && <SparkPanel spark={spark} />}

        <Footer />
      </main>
    </>
  );
}
