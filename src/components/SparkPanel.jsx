import { BsStars } from "react-icons/bs";

export default function SparkPanel({ spark }) {
  return (
    <section
      className={`spark-card ${spark.isClosing ? "closing" : "opening"}`}
      aria-label="Spark deep dive"
    >
      <div className="spark-header">
        <p className="spark-eyebrow">
          <BsStars aria-hidden="true" />
          <span>Spark deep dive</span>
        </p>

        <button
          className="spark-regenerate-button"
          type="button"
          onClick={() => spark.generate()}
          disabled={spark.loading || !spark.canGenerateMoreQuestions}
        >
          {spark.loading
            ? "Thinking..."
            : spark.canGenerateMoreQuestions
              ? "Generate more"
              : "Limit reached"}
        </button>
      </div>

      {spark.error && <p className="spark-error">{spark.error}</p>}

      <div className="spark-content" aria-live="polite">
        {spark.loading && spark.questions.length === 0 && (
          <div className="spark-thinking" role="status" aria-live="polite">
            <span>Thinking</span>
            <span className="spark-thinking-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}

        {!spark.error && spark.questions.length > 0 && (
          <article className="spark-question-card">
            <p className="spark-question">
              {spark.questions[spark.questionIndex]}
            </p>

            <p className="spark-question-count">
              {spark.questionIndex + 1} / {spark.questions.length}
            </p>
          </article>
        )}
      </div>

      <div className="spark-navigation">
        <button
          type="button"
          onClick={spark.goToPreviousQuestion}
          disabled={spark.questionIndex === 0}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={spark.goToNextQuestion}
          disabled={
            spark.questions.length === 0 ||
            spark.questionIndex === spark.questions.length - 1
          }
        >
          Next
        </button>
      </div>

      {spark.questions.length > 0 && spark.maxTotalQuestions !== null && (
        <p className="spark-limit-text">
          {spark.questions.length} of {spark.maxTotalQuestions} questions
          generated, {spark.remainingGenerations} generation
          {spark.remainingGenerations === 1 ? "" : "s"} remaining.
        </p>
      )}
    </section>
  );
}
