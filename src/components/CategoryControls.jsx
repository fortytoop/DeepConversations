import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

export default function CategoryControls({
  category,
  categoryAnimation,
  pressedCategoryDirection,
  previousCategory,
  onNextCategory,
  onPreviousCategory,
}) {
  return (
    <section className="controls" aria-label="Question categories">
      <button
        className={`category-arrow ${
          pressedCategoryDirection === "left" ? "pressed-left" : ""
        }`}
        type="button"
        onClick={onPreviousCategory}
        aria-label="Previous category"
      >
        <BsChevronLeft />
      </button>

      <div className={`category-pill-wrapper ${categoryAnimation || ""}`}>
        {previousCategory && (
          <div className="category-pill category-pill-old">
            {previousCategory}
          </div>
        )}

        <div className="category-pill category-pill-new">{category}</div>
      </div>

      <button
        className={`category-arrow ${
          pressedCategoryDirection === "right" ? "pressed-right" : ""
        }`}
        type="button"
        onClick={onNextCategory}
        aria-label="Next category"
      >
        <BsChevronRight />
      </button>
    </section>
  );
}
