import { BsArrowDown, BsArrowUp, BsShuffle } from "react-icons/bs";

export default function CardNavigation({
  isShuffled,
  pressedCardDirection,
  shufflePressed,
  onNextCard,
  onPreviousCard,
  onShuffleClick,
}) {
  return (
    <div className="card-nav-buttons">
      <button
        className={`shuffle-button ${isShuffled ? "active" : ""} ${
          shufflePressed ? "clicked" : ""
        }`}
        type="button"
        onClick={onShuffleClick}
        aria-label="Shuffle cards"
        aria-pressed={isShuffled}
      >
        <BsShuffle />
      </button>

      <button
        className={pressedCardDirection === "up" ? "pressed-up" : ""}
        type="button"
        onClick={onPreviousCard}
        aria-label="Previous card"
      >
        <BsArrowUp />
      </button>

      <button
        className={pressedCardDirection === "down" ? "pressed-down" : ""}
        type="button"
        onClick={onNextCard}
        aria-label="Next card"
      >
        <BsArrowDown />
      </button>
    </div>
  );
}
