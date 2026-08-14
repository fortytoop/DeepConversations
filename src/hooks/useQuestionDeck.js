import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  CATEGORY_ANIMATION_MS,
  PRESS_FEEDBACK_MS,
  STACK_ANIMATION_MS,
  VISIBLE_CARD_COUNT,
} from "../constants";
import { shuffleArray } from "../utils/shuffleArray";

const REDUCED_MOTION_NAVIGATION_MS = 180;

// Controls the question deck state for category navigation, card navigation,
// card shuffling, and animation/transitions
export function useQuestionDeck(allQuestions) {
  const prefersReducedMotion = useReducedMotion();
  const [shuffledCardsByCategory, setShuffledCardsByCategory] = useState(
    () => new Map(),
  );
  const [cardIndex, setCardIndex] = useState(0);
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

  const originalCategoryCards = useMemo(
    () => allQuestions.filter((card) => card.category === category),
    [allQuestions, category],
  );

  // Each category keeps one fixed shuffled order until shuffle is turned off.
  const filteredCards =
    shuffledCardsByCategory.get(category) ?? originalCategoryCards;
  const isShuffled = shuffledCardsByCategory.has(category);

  const currentCard = filteredCards[cardIndex];
  const stackAnimationDuration = prefersReducedMotion
    ? REDUCED_MOTION_NAVIGATION_MS
    : STACK_ANIMATION_MS;
  const categoryAnimationDuration = prefersReducedMotion
    ? REDUCED_MOTION_NAVIGATION_MS
    : CATEGORY_ANIMATION_MS;

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
    setTimeout(clearCardPressFeedback, stackAnimationDuration);
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
    setTimeout(clearCardPressFeedback, stackAnimationDuration);
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
    }, categoryAnimationDuration);
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
      const originalIndex = originalCategoryCards.findIndex(
        (card) => card.id === currentCardId,
      );

      // When unshuffling, restore the original order and keep current card
      setShuffledCardsByCategory((previousOrders) => {
        const updatedOrders = new Map(previousOrders);
        updatedOrders.delete(category);
        return updatedOrders;
      });
      setCardIndex(Math.max(originalIndex, 0));
      return;
    }

    const current = originalCategoryCards.find(
      (card) => card.id === currentCardId,
    );
    const remaining = originalCategoryCards.filter(
      (card) => card.id !== currentCardId,
    );

    // Keep the current card first, then visit every other card exactly once
    // before the navigation wraps back to the start of this fixed order.
    setShuffledCardsByCategory((previousOrders) => {
      const updatedOrders = new Map(previousOrders);
      updatedOrders.set(category, [current, ...shuffleArray(remaining)]);
      return updatedOrders;
    });
    setCardIndex(0);
  }

  function handleShuffleClick() {
    setShufflePressed(true);
    toggleShuffle();
    setTimeout(() => setShufflePressed(false), PRESS_FEEDBACK_MS);
  }

  return {
    cardNumber,
    category,
    categoryCount: categories.length,
    categoryAnimation,
    categoryNumber: categoryIndex + 1,
    currentCard,
    goToNextCard,
    goToNextCategory,
    goToPreviousCard,
    goToPreviousCategory,
    handleShuffleClick,
    isShuffled,
    previousCategory,
    previousCategoryNumber: previousCategory
      ? categories.indexOf(previousCategory) + 1
      : null,
    previousCategoryCardNumber,
    previousCategoryCards,
    pressedCardDirection,
    pressedCategoryDirection,
    shufflePressed,
    stackAnimation,
    visibleCards,
  };
}
