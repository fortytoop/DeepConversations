import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

export default function CategoryControls({
  category,
  categoryCount,
  categoryAnimation,
  categoryNumber,
  pressedCategoryDirection,
  previousCategory,
  previousCategoryNumber,
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
        title="Previous category"
      >
        <BsChevronLeft />
      </button>

      <div className={`category-pill-wrapper ${categoryAnimation || ""}`}>
        {previousCategory && (
          <h2
            className="category-pill category-pill-old"
            aria-hidden="true"
          >
            <span className="category-pill-label">{previousCategory}</span>
            <CategoryProgress
              categoryCount={categoryCount}
              categoryNumber={previousCategoryNumber}
            />
          </h2>
        )}

        <h2
          className="category-pill category-pill-new"
          aria-label={`${category}, category ${categoryNumber} of ${categoryCount}`}
        >
          <span className="category-pill-label" key={category}>
            {category}
          </span>
          <CategoryProgress
            categoryCount={categoryCount}
            categoryNumber={categoryNumber}
          />
        </h2>
      </div>

      <button
        className={`category-arrow ${
          pressedCategoryDirection === "right" ? "pressed-right" : ""
        }`}
        type="button"
        onClick={onNextCategory}
        aria-label="Next category"
        title="Next category"
      >
        <BsChevronRight />
      </button>
    </section>
  );
}

function CategoryProgress({ categoryCount, categoryNumber }) {
  return (
    <span className="category-progress" aria-hidden="true">
      {Array.from({ length: categoryCount }, (_, index) => (
        <span
          className={`category-progress-dot${
            index + 1 === categoryNumber ? " active" : ""
          }`}
          key={index}
        ></span>
      ))}
    </span>
  );
}
