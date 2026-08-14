export default function CardStack({
  cardNumber,
  categoryAnimation,
  previousCategoryCardNumber,
  previousCategoryCards,
  stackAnimation,
  visibleCards,
}) {
  const currentCard = visibleCards[0];

  return (
    <>
      <p className="visually-hidden" role="status" aria-atomic="true">
        {currentCard
          ? `Category: ${currentCard.category}. Question ${cardNumber} of 15: ${currentCard.question}`
          : ""}
      </p>

      <section
        className={`card-stack ${
          stackAnimation ? `stack-${stackAnimation}` : ""
        } ${categoryAnimation ? `category-${categoryAnimation}` : ""}`}
      >
        <Cards
          cards={previousCategoryCards}
          variant="old"
          count={previousCategoryCardNumber ?? cardNumber}
        />
        <Cards cards={visibleCards} variant="new" count={cardNumber} />
      </section>
    </>
  );
}

function Cards({ cards, variant, count }) {
  const lastCardIndex = Math.max(cards.length - 1, 0);

  return cards.map((card, visibleCardIndex) => (
    <div
      key={`${variant}-${card.id}-${visibleCardIndex}`}
      className={`card ${
        visibleCardIndex === 0 ? "card-current" : ""
      } ${variant}-card`}
      aria-hidden={variant === "old" || visibleCardIndex !== 0}
      data-nosnippet
      style={{
        "--card-index": String(visibleCardIndex),
        "--card-count": String(cards.length),
        "--card-reverse-index": String(lastCardIndex - visibleCardIndex),
      }}
    >
      {visibleCardIndex === 0 && (
        <>
          <div className="question-container">
            <p className="card-question">{card.question}</p>
          </div>

          <p className="card-count">{count} / 15</p>
        </>
      )}
    </div>
  ));
}
