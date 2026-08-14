import {
  BsArrowClockwise,
  BsArrowLeft,
  BsArrowRight,
  BsExclamationCircle,
  BsLock,
  BsPlusLg,
  BsStars,
} from "react-icons/bs";

export default function SparkPanel({ spark }) {
  const generateButtonLabel = spark.loading
    ? "Generating questions"
    : spark.error
      ? "Try generating questions again"
      : spark.canGenerateMoreQuestions
        ? "Generate more questions"
        : "Question limit reached";

  return (
    <section
      className={`spark-card ${spark.isClosing ? "closing" : "opening"}`}
      aria-label="Spark deep dive"
    >
      <div className="spark-header">
        <h3 className="spark-eyebrow">
          <BsStars aria-hidden="true" />
          <span>Spark AI</span>
        </h3>

        <button
          className={`spark-regenerate-button${spark.loading ? " is-generating" : ""}`}
          type="button"
          onClick={() => spark.generate()}
          disabled={spark.loading || !spark.canGenerateMoreQuestions}
          aria-label={generateButtonLabel}
          title={generateButtonLabel}
        >
          {spark.loading ? (
            <span
              className="spark-thinking-dots spark-regenerate-dots"
              aria-hidden="true"
            >
              <span></span>
              <span></span>
              <span></span>
            </span>
          ) : spark.error ? (
            <>
              <BsArrowClockwise aria-hidden="true" />
              <span>Try again</span>
            </>
          ) : spark.canGenerateMoreQuestions ? (
            <>
              <BsPlusLg className="spark-plus-icon" aria-hidden="true" />
              <span>Generate more</span>
            </>
          ) : (
            <>
              <BsLock className="spark-lock-icon" aria-hidden="true" />
              <span>Limit reached</span>
            </>
          )}
        </button>
      </div>

      <div className="spark-content" aria-live="polite">
        {spark.loading && spark.questions.length === 0 && (
          <article
            className="spark-question-card spark-question-skeleton"
            role="status"
            aria-label="Generating questions"
          >
            <span className="spark-question-skeleton-line" aria-hidden="true"></span>
            <span className="spark-question-skeleton-line" aria-hidden="true"></span>
            <span className="spark-question-skeleton-line" aria-hidden="true"></span>
          </article>
        )}

        {spark.error && spark.questions.length === 0 && (
          <div
            className="spark-error-message spark-standalone-error"
            role="alert"
          >
            <BsExclamationCircle aria-hidden="true" />
            <p className="spark-error">{spark.error}</p>
          </div>
        )}

        {spark.questions.length > 0 && (
          <article className="spark-question-card">
            <p className="spark-question">
              {spark.questions[spark.questionIndex]}
            </p>

            <p className="spark-question-count">
              {spark.questionIndex + 1} / {spark.questions.length}
            </p>
          </article>
        )}

        {spark.error && spark.questions.length > 0 && (
          <div className="spark-error-message spark-inline-error" role="alert">
            <BsExclamationCircle aria-hidden="true" />
            <p className="spark-error">{spark.error}</p>
          </div>
        )}
      </div>

      <div className="spark-navigation">
        <button
          type="button"
          onClick={spark.goToPreviousQuestion}
          disabled={spark.questionIndex === 0}
          title="Previous follow-up question"
        >
          <BsArrowLeft aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={spark.goToNextQuestion}
          disabled={
            spark.questions.length === 0 ||
            spark.questionIndex === spark.questions.length - 1
          }
          title="Next follow-up question"
        >
          <BsArrowRight aria-hidden="true" />
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
