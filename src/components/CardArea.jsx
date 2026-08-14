import { BsStars, BsX } from "react-icons/bs";
import CardNavigation from "./CardNavigation";
import CardStack from "./CardStack";

export default function CardArea({
  cardNumber,
  categoryAnimation,
  isShuffled,
  isSparkOpen,
  previousCategoryCardNumber,
  previousCategoryCards,
  pressedCardDirection,
  shufflePressed,
  stackAnimation,
  visibleCards,
  onNextCard,
  onPreviousCard,
  onShuffleClick,
  onSparkClick,
}) {
  const sparkButtonLabel = isSparkOpen
    ? "Close"
    : "Show follow-up questions";

  return (
    <section className="card-area">
      <svg
        className="spark-gradient-definitions"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="spark-button-icon-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              className="spark-icon-stop spark-icon-stop-start"
              offset="0%"
              stopColor="#4285f4"
            />
            <stop
              className="spark-icon-stop spark-icon-stop-middle"
              offset="50%"
              stopColor="#8b5cf6"
            />
            <stop
              className="spark-icon-stop spark-icon-stop-end"
              offset="100%"
              stopColor="#ec4899"
            />
          </linearGradient>
        </defs>
      </svg>

      <div className="left-controls">
        <button
          className="ai-button"
          type="button"
          onClick={onSparkClick}
          aria-label={sparkButtonLabel}
          title={sparkButtonLabel}
          aria-expanded={isSparkOpen}
        >
          {isSparkOpen ? (
            <BsX className="spark-gradient-icon" />
          ) : (
            <BsStars className="spark-gradient-icon" />
          )}
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
