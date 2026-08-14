import { useLayoutEffect, useRef, useState } from "react";
import {
  BsArrowClockwise,
  BsArrowLeft,
  BsArrowRight,
  BsExclamationCircle,
  BsLock,
  BsPlusLg,
  BsStars,
} from "react-icons/bs";
import { SPARK_PANEL_ID } from "../constants";

export default function SparkPanel({ spark, sparkButtonPosition }) {
  const panelRef = useRef(null);
  const heightAnimationRef = useRef(null);
  const previousPanelHeightRef = useRef(null);
  const previousQuestionCountRef = useRef(spark.questions.length);
  const [isOriginReady, setIsOriginReady] = useState(false);

  useLayoutEffect(() => {
    if (!panelRef.current) return;

    if (!sparkButtonPosition) {
      setIsOriginReady(true);
      return;
    }

    const panelBounds = panelRef.current.getBoundingClientRect();
    panelRef.current.style.setProperty(
      "--spark-origin-x",
      `${sparkButtonPosition.x - panelBounds.left}px`,
    );
    panelRef.current.style.setProperty(
      "--spark-origin-y",
      `${sparkButtonPosition.y - panelBounds.top}px`,
    );
    setIsOriginReady(true);
  }, [sparkButtonPosition]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const panelHeight = panel.offsetHeight;
    const previousPanelHeight = previousPanelHeightRef.current;
    const questionsWereAdded =
      spark.questions.length > previousQuestionCountRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      questionsWereAdded &&
      previousPanelHeight !== null &&
      previousPanelHeight !== panelHeight &&
      !prefersReducedMotion
    ) {
      heightAnimationRef.current?.cancel();
      panel.style.overflow = "hidden";

      const heightAnimation = panel.animate(
        [
          { height: `${previousPanelHeight}px` },
          { height: `${panelHeight}px` },
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );

      heightAnimationRef.current = heightAnimation;

      function finishHeightAnimation() {
        if (heightAnimationRef.current !== heightAnimation) return;

        panel.style.removeProperty("overflow");
        heightAnimationRef.current = null;
      }

      heightAnimation.addEventListener("finish", finishHeightAnimation, {
        once: true,
      });
      heightAnimation.addEventListener("cancel", finishHeightAnimation, {
        once: true,
      });
    }

    previousPanelHeightRef.current = panelHeight;
    previousQuestionCountRef.current = spark.questions.length;
  });

  useLayoutEffect(
    () => () => {
      heightAnimationRef.current?.cancel();
    },
    [],
  );

  const panelAnimation = spark.isClosing
    ? "closing"
    : isOriginReady
      ? "opening"
      : "preparing";

  const generateButtonLabel = spark.loading
    ? "Generating questions"
    : spark.error
      ? "Try generating questions again"
      : spark.canGenerateMoreQuestions
        ? "Generate more questions"
        : "Question limit reached";

  return (
    <div className={`spark-panel-slot ${panelAnimation}`}>
      <div className="spark-panel-slot-inner">
        <section
          id={SPARK_PANEL_ID}
          ref={panelRef}
          className={`spark-card ${panelAnimation}`}
          aria-labelledby="spark-panel-heading"
        >
          <div className="spark-header">
            <h2 className="spark-eyebrow" id="spark-panel-heading">
              <BsStars aria-hidden="true" />
              <span>Spark AI</span>
            </h2>

            <button
              className={`spark-regenerate-button${spark.loading ? " is-generating" : ""}`}
              type="button"
              onClick={() => spark.generate()}
              disabled={spark.loading || !spark.canGenerateMoreQuestions}
              aria-label={generateButtonLabel}
              title={generateButtonLabel}
            >
              {spark.loading ? (
                <span className="spark-regenerate-thinking" aria-hidden="true">
                  <span className="spark-thinking-dots spark-regenerate-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span>Thinking</span>
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

          <div className="spark-content">
            {spark.loading && spark.questions.length === 0 && (
              <article
                className="spark-question-card spark-question-skeleton"
                aria-hidden="true"
              >
                <span
                  className="spark-question-skeleton-line"
                  aria-hidden="true"
                ></span>
                <span
                  className="spark-question-skeleton-line"
                  aria-hidden="true"
                ></span>
                <span
                  className="spark-question-skeleton-line"
                  aria-hidden="true"
                ></span>
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
              <div
                className={`spark-question-stage${
                  spark.questionAnimation
                    ? ` spark-question-transition-${spark.questionAnimation}`
                    : ""
                }`}
              >
                {spark.questions.map((question, index) => {
                  const isCurrent = index === spark.questionIndex;
                  const isPrevious =
                    spark.questionAnimation &&
                    index === spark.previousQuestionIndex;
                  const cardState = isCurrent
                    ? "spark-question-current"
                    : isPrevious
                      ? "spark-question-outgoing"
                      : "spark-question-measure";

                  return (
                    <article
                      className={`spark-question-card ${cardState}`}
                      aria-hidden={!isCurrent}
                      key={`${index}-${question}`}
                    >
                      <p className="spark-question">{question}</p>

                      <p className="spark-question-count">
                        {index + 1} / {spark.questions.length}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}

            {spark.error && spark.questions.length > 0 && (
              <div
                className="spark-error-message spark-inline-error"
                role="alert"
              >
                <BsExclamationCircle aria-hidden="true" />
                <p className="spark-error">{spark.error}</p>
              </div>
            )}
          </div>

          <div className="spark-navigation">
            <button
              className={
                spark.pressedQuestionDirection === "left"
                  ? "pressed-left"
                  : ""
              }
              type="button"
              onClick={spark.goToPreviousQuestion}
              disabled={spark.questionIndex === 0}
              aria-label="Previous follow-up question"
              title="Previous follow-up question"
            >
              <BsArrowLeft aria-hidden="true" />
            </button>

            <button
              className={
                spark.pressedQuestionDirection === "right"
                  ? "pressed-right"
                  : ""
              }
              type="button"
              onClick={spark.goToNextQuestion}
              disabled={
                spark.questions.length === 0 ||
                spark.questionIndex === spark.questions.length - 1
              }
              aria-label="Next follow-up question"
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
      </div>
    </div>
  );
}
