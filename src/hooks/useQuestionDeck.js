import { useMemo, useState } from "react";
import {
  CATEGORY_ANIMATION_MS,
  PRESS_FEEDBACK_MS,
  STACK_ANIMATION_MS,
  VISIBLE_CARD_COUNT,
} from "../constants";
import { shuffleArray } from "../utils/shuffleArray";

// Controls the question deck state for category navigation, card navigation,
// card shuffling, and animation/transitions
export function useQuestionDeck(allQuestions) {
  const [cards, setCards] = useState(allQuestions); // Order either original or shuffled
  const [cardIndex, setCardIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shufflePressed, setShufflePressed] = useState(false);
  const [pressedCardDirection, setPressedCardDirection] = useState(null);
  const [stackAnimation, setStackAnimation] = useState(null);

  const [previousCategory, setPreviousCategory] = useState(null);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [pressedCategoryDirection, setPressedCategoryDirection] =
    useState(null);
  const [previousCategoryCards, setPreviousCategoryCards] = useState([]);
  const [previousCategoryCardNumber, setPreviousCategoryCardNumber] =
    useState(null);
  const [categoryAnimation, setCategoryAnimation] = useState(null);

  // Build the category list from the questions given (json)
  const categories = useMemo(
    () => [...new Set(allQuestions.map(({ category }) => category))],
    [allQuestions],
  );

  const category = categories[categoryIndex];

  // Only show cards from active category, either original or shuffled order
  const filteredCards = useMemo(
    () => cards.filter((card) => card.category === category),
    [cards, category],
  );

  const currentCard = filteredCards[cardIndex];

  // Build the visible stack, wrapping around when at end
  const visibleCards = useMemo(() => {
    if (filteredCards.length === 0) return [];

    return Array.from({ length: VISIBLE_CARD_COUNT }, (_, offset) => {
      const nextIndex = (cardIndex + offset) % filteredCards.length;
      return filteredCards[nextIndex];
    }).filter(Boolean);
  }, [filteredCards, cardIndex]);

  // TODO: Only 15 questions per category, but change to length of category instead
  const cardNumber = currentCard ? (currentCard.id % 15) + 1 : 0;

  function clearCardPressFeedback() {
    setPressedCardDirection(null);
    setStackAnimation(null);
  }

  function goToNextCard() {
    // Prevent overlapping card/category animations
    if (filteredCards.length === 0 || stackAnimation || categoryAnimation) {
      return;
    }

    setPressedCardDirection("down");
    setStackAnimation("down");
    setCardIndex((previousIndex) => (previousIndex + 1) % filteredCards.length);
    setTimeout(clearCardPressFeedback, STACK_ANIMATION_MS);
  }

  function goToPreviousCard() {
    // Prevent overlapping card/category animations
    if (filteredCards.length === 0 || stackAnimation || categoryAnimation) {
      return;
    }

    setPressedCardDirection("up");
    setStackAnimation("up");
    setCardIndex((previousIndex) =>
      previousIndex === 0 ? filteredCards.length - 1 : previousIndex - 1,
    );
    setTimeout(clearCardPressFeedback, STACK_ANIMATION_MS);
  }

  function startCategoryTransition(direction, getNextIndex) {
    if (categoryAnimation) return;

    setPressedCategoryDirection(direction === "next" ? "right" : "left");
    setPreviousCategory(category);
    setPreviousCategoryCards(visibleCards);
    setPreviousCategoryCardNumber(cardNumber);
    setCategoryAnimation(direction);
    setCategoryIndex(getNextIndex);
    setCardIndex(0);

    setTimeout(() => {
      setPressedCategoryDirection(null);
      setPreviousCategory(null);
      setPreviousCategoryCards([]);
      setPreviousCategoryCardNumber(null);
      setCategoryAnimation(null);
    }, CATEGORY_ANIMATION_MS);
  }

  function goToNextCategory() {
    startCategoryTransition(
      "next",
      (previousIndex) => (previousIndex + 1) % categories.length,
    );
  }

  function goToPreviousCategory() {
    startCategoryTransition("previous", (previousIndex) =>
      previousIndex === 0 ? categories.length - 1 : previousIndex - 1,
    );
  }

  function toggleShuffle() {
    if (!currentCard) return;

    const currentCardId = currentCard.id;

    if (isShuffled) {
      const originalCategoryCards = allQuestions.filter(
        (card) => card.category === category,
      );
      const originalIndex = originalCategoryCards.findIndex(
        (card) => card.id === currentCardId,
      );

      // When unshuffling, restore the original order and keep current card
      setCards(allQuestions);
      setCardIndex(Math.max(originalIndex, 0));
      setIsShuffled(false);
      return;
    }

    const currentCategoryCards = allQuestions.filter(
      (card) => card.category === category,
    );
    const currentCategoryCardIds = new Set(
      currentCategoryCards.map((card) => card.id),
    );
    const current = currentCategoryCards.find(
      (card) => card.id === currentCardId,
    );
    const remaining = currentCategoryCards.filter(
      (card) => card.id !== currentCardId,
    );
    const otherCards = allQuestions.filter(
      (card) => !currentCategoryCardIds.has(card.id),
    );

    // When shuffling, shuffle all next and previous cards but keep the current card
    setCards([...otherCards, current, ...shuffleArray(remaining)]);
    setCardIndex(0);
    setIsShuffled(true);
  }

  function handleShuffleClick() {
    setShufflePressed(true);
    toggleShuffle();
    setTimeout(() => setShufflePressed(false), PRESS_FEEDBACK_MS);
  }

  return {
    cardNumber,
    category,
    categoryAnimation,
    currentCard,
    goToNextCard,
    goToNextCategory,
    goToPreviousCard,
    goToPreviousCategory,
    handleShuffleClick,
    isShuffled,
    previousCategory,
    previousCategoryCardNumber,
    previousCategoryCards,
    pressedCardDirection,
    pressedCategoryDirection,
    shufflePressed,
    stackAnimation,
    visibleCards,
  };
}
