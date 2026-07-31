export default function CardStack({
  cardNumber,
  categoryAnimation,
  previousCategoryCardNumber,
  previousCategoryCards,
  stackAnimation,
  visibleCards,
}) {
  return (
    <section
      className={`card-stack ${
        stackAnimation ? `stack-${stackAnimation}` : ""
      } ${categoryAnimation ? `category-${categoryAnimation}` : ""}`}
      aria-live="polite"
    >
      <Cards
        cards={previousCategoryCards}
        variant="old"
        count={previousCategoryCardNumber ?? cardNumber}
      />
      <Cards cards={visibleCards} variant="new" count={cardNumber} />
    </section>
  );
}

function Cards({ cards, variant, count }) {
  const lastCardIndex = Math.max(cards.length - 1, 0);

  return cards.map((card, visibleCardIndex) => (
    <article
      key={`${variant}-${card.id}-${visibleCardIndex}`}
      className={`card ${
        visibleCardIndex === 0 ? "card-current" : ""
      } ${variant}-card`}
      style={{
        "--card-index": String(visibleCardIndex),
        "--card-count": String(cards.length),
        "--card-reverse-index": String(lastCardIndex - visibleCardIndex),
      }}
    >
      {visibleCardIndex === 0 && (
        <>
          <div className="question-container">
            <h3>{card.question}</h3>
          </div>

          <p className="card-count">{count} / 15</p>
        </>
      )}
    </article>
  ));
}
