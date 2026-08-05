export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-content">
        <span>© {new Date().getFullYear()}</span>
        <span className="footer-separator" aria-hidden="true">
          ·
        </span>
        <a
          href="https://your-personal-site.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit author’s website"
        >
          Prateep Kasinathan
        </a>
      </p>
    </footer>
  );
}
