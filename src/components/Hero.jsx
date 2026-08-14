export default function Hero() {
  return (
    <section className="hero">
      <h1>Deep Conversations</h1>
      <p className="subtitle">
        Questions by the{" "}
        <a
          href="https://www.gottman.com/blog/75-insightful-questions-to-deepen-emotional-intimacy/"
          target="_blank"
          rel="noopener noreferrer"
          title="Read the Gottman Institute article (opens in a new tab)"
        >
          Gottman Institute
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </section>
  );
}
