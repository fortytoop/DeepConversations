import { useEffect } from "react";
import { Link } from "react-router-dom";
import AnimatingBackground from "../components/AnimatingBackground";

export default function PageNotFound() {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Page not found — Deep Conversations";
    document.body.classList.add("not-found-active");

    return () => {
      document.title = previousTitle;
      document.body.classList.remove("not-found-active");
    };
  }, []);

  return (
    <>
      <AnimatingBackground />

      <main className="not-found-page">
        <section className="not-found-card" aria-labelledby="not-found-title">
          <p className="error-code">404 - Page not found</p>
          <h2 className="not-found-title" id="not-found-title">
            Lost the conversation?
          </h2>
          <p className="not-found-message">
            We couldn’t find the page you’re looking for. It may have moved, or
            the address might be wrong.
          </p>
          <Link className="home-button" to="/">
            Back home
          </Link>
        </section>
      </main>
    </>
  );
}
