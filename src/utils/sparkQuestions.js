// Extracts and cleans spark questions
export function getSparkQuestions(data) {
  const questions = Array.isArray(data?.questions) ? data.questions : [];

  return questions.map((question) => String(question).trim()).filter(Boolean);
}
