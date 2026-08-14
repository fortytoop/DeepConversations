import { BsArrowDown, BsArrowUp, BsShuffle } from "react-icons/bs";

export default function CardNavigation({
  isShuffled,
  pressedCardDirection,
  shufflePressed,
  onNextCard,
  onPreviousCard,
  onShuffleClick,
}) {
  const shuffleLabel = isShuffled
    ? "Restore question order"
    : "Shuffle question order";

  return (
    <div className="card-nav-buttons">
      <button
        className={`shuffle-button ${isShuffled ? "active" : ""} ${
          shufflePressed ? "clicked" : ""
        }`}
        type="button"
        onClick={onShuffleClick}
        aria-label={shuffleLabel}
        title={shuffleLabel}
        aria-pressed={isShuffled}
      >
        <BsShuffle />
      </button>

      <button
        className={pressedCardDirection === "up" ? "pressed-up" : ""}
        type="button"
        onClick={onPreviousCard}
        aria-label="Previous question"
        title="Previous question"
      >
        <BsArrowUp />
      </button>

      <button
        className={pressedCardDirection === "down" ? "pressed-down" : ""}
        type="button"
        onClick={onNextCard}
        aria-label="Next question"
        title="Next question"
      >
        <BsArrowDown />
      </button>
    </div>
  );
}
