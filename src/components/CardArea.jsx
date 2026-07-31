import { BsStars } from "react-icons/bs";
import CardNavigation from "./CardNavigation";
import CardStack from "./CardStack";

export default function CardArea({
  cardNumber,
  categoryAnimation,
  isShuffled,
  isSparkOpen,
  isSparkPressed,
  previousCategoryCardNumber,
  previousCategoryCards,
  pressedCardDirection,
  shufflePressed,
  stackAnimation,
  visibleCards,
  onNextCard,
  onPreviousCard,
  onShuffleClick,
  onSparkAnimationEnd,
  onSparkClick,
}) {
  return (
    <section className="card-area">
      <div className="left-controls">
        <button
          className={`ai-button ${isSparkPressed ? "clicked" : ""}`}
          type="button"
          onClick={onSparkClick}
          onAnimationEnd={onSparkAnimationEnd}
          aria-label="Open Spark deep dive"
          aria-expanded={isSparkOpen}
        >
          <BsStars />
        </button>
      </div>

      <CardStack
        cardNumber={cardNumber}
        categoryAnimation={categoryAnimation}
        previousCategoryCardNumber={previousCategoryCardNumber}
        previousCategoryCards={previousCategoryCards}
        stackAnimation={stackAnimation}
        visibleCards={visibleCards}
      />

      <CardNavigation
        isShuffled={isShuffled}
        pressedCardDirection={pressedCardDirection}
        shufflePressed={shufflePressed}
        onNextCard={onNextCard}
        onPreviousCard={onPreviousCard}
        onShuffleClick={onShuffleClick}
      />
    </section>
  );
}
