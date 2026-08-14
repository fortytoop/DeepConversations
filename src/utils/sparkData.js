const MAX_SAFE_QUESTIONS_PER_CARD_CACHE = 15;
const MAX_SAFE_DISPLAY_LENGTH = 500;

function parseQuestions(value, maxQuestions) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxQuestions) {
    return null;
  }

  const questions = [];

  for (const valueQuestion of value) {
    if (typeof valueQuestion !== "string") return null;

    const question = valueQuestion.trim();
    if (!question || question.length > MAX_SAFE_DISPLAY_LENGTH) return null;

    questions.push(question);
  }

  return questions;
}

function parseGenerationMetadata(data, totalQuestionCount) {
  if (
    !Number.isInteger(data?.questionsPerBatch) ||
    data.questionsPerBatch < 1 ||
    data.questionsPerBatch > MAX_SAFE_QUESTIONS_PER_CARD_CACHE ||
    !Number.isInteger(data?.remainingGenerations) ||
    data.remainingGenerations < 0 ||
    !Number.isInteger(data?.maxTotalQuestions) ||
    data.maxTotalQuestions < data.questionsPerBatch ||
    data.maxTotalQuestions > MAX_SAFE_QUESTIONS_PER_CARD_CACHE ||
    totalQuestionCount > data.maxTotalQuestions
  ) {
    return null;
  }

  const expectedRemainingGenerations = Math.floor(
    (data.maxTotalQuestions - totalQuestionCount) / data.questionsPerBatch,
  );

  if (data.remainingGenerations !== expectedRemainingGenerations) return null;

  return {
    questionsPerBatch: data.questionsPerBatch,
    remainingGenerations: data.remainingGenerations,
    maxTotalQuestions: data.maxTotalQuestions,
  };
}

export function parseSparkResponse(data, previousQuestionCount) {
  if (
    !Number.isInteger(previousQuestionCount) ||
    previousQuestionCount < 0 ||
    previousQuestionCount > MAX_SAFE_QUESTIONS_PER_CARD_CACHE ||
    !Number.isInteger(data?.questionsPerBatch) ||
    data.questionsPerBatch < 1 ||
    data.questionsPerBatch > MAX_SAFE_QUESTIONS_PER_CARD_CACHE
  ) {
    return null;
  }

  const questions = parseQuestions(data?.questions, data.questionsPerBatch);
  if (!questions) return null;

  const totalQuestionCount = previousQuestionCount + questions.length;

  const metadata = parseGenerationMetadata(data, totalQuestionCount);
  if (!metadata) return null;

  return { questions, ...metadata };
}

export function parseSparkCacheData(data) {
  const questions = parseQuestions(
    data?.questions,
    MAX_SAFE_QUESTIONS_PER_CARD_CACHE,
  );
  if (!questions) return null;

  const metadata = parseGenerationMetadata(data, questions.length);
  if (!metadata) return null;

  return { questions, ...metadata };
}
