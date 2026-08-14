export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-content">
        <span>© {new Date().getFullYear()}</span>
        <span className="footer-separator" aria-hidden="true">
          ·
        </span>
        <a
          href="https://prateepkasinathan.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit author’s website (opens in a new tab)"
        >
          Prateep Kasinathan
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
    </footer>
  );
}
