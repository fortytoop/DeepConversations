import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { THEME_TRANSITION_MS } from "../constants";

const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";
const THEME_TRANSITION_CLASS = "theme-transitioning";
const THEME_TRANSITION_CLEANUP_CLASS = "theme-transition-cleanup";
const THEME_TRANSITION_SENTINEL = "--theme-button-surface-color";
const THEME_TRANSITION_FALLBACK_BUFFER_MS = 100;
const THEME_TRANSITION_CLEANUP_MS = 100;

function getSystemTheme() {
  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getSystemTheme);
  const transitionTimeoutRef = useRef(null);
  const transitionEndHandlerRef = useRef(null);
  const transitionCleanupTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const browserBackground = getComputedStyle(root)
      .getPropertyValue("--browser-background")
      .trim();

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", browserBackground);

    if (root.classList.contains(THEME_TRANSITION_CLASS)) {
      window.clearTimeout(transitionTimeoutRef.current);
      root.removeEventListener(
        "transitionend",
        transitionEndHandlerRef.current,
      );

      const finishThemeTransition = () => {
        window.clearTimeout(transitionTimeoutRef.current);
        root.removeEventListener(
          "transitionend",
          transitionEndHandlerRef.current,
        );

        root.classList.add(THEME_TRANSITION_CLEANUP_CLASS);
        root.classList.remove(THEME_TRANSITION_CLASS);
        void root.offsetWidth;

        transitionCleanupTimeoutRef.current = window.setTimeout(() => {
          root.classList.remove(THEME_TRANSITION_CLEANUP_CLASS);
          transitionCleanupTimeoutRef.current = null;
        }, THEME_TRANSITION_CLEANUP_MS);

        transitionTimeoutRef.current = null;
        transitionEndHandlerRef.current = null;
      };

      transitionEndHandlerRef.current = (event) => {
        if (
          event.target === root &&
          event.propertyName === THEME_TRANSITION_SENTINEL
        ) {
          finishThemeTransition();
        }
      };

      root.addEventListener("transitionend", transitionEndHandlerRef.current);
      transitionTimeoutRef.current = window.setTimeout(
        finishThemeTransition,
        THEME_TRANSITION_MS + THEME_TRANSITION_FALLBACK_BUFFER_MS,
      );
    }
  }, [theme]);

  useEffect(
    () => () => {
      window.clearTimeout(transitionTimeoutRef.current);
      window.clearTimeout(transitionCleanupTimeoutRef.current);
      const root = document.documentElement;

      root.removeEventListener(
        "transitionend",
        transitionEndHandlerRef.current,
      );
      root.classList.remove(THEME_TRANSITION_CLASS);
      root.classList.remove(THEME_TRANSITION_CLEANUP_CLASS);
    },
    [],
  );

  function toggleTheme() {
    const root = document.documentElement;

    window.clearTimeout(transitionTimeoutRef.current);
    window.clearTimeout(transitionCleanupTimeoutRef.current);
    root.classList.remove(THEME_TRANSITION_CLEANUP_CLASS);
    root.classList.add(THEME_TRANSITION_CLASS);

    // Ensure the coordinated transition properties are active before the
    // theme variables change in the following render.
    void root.offsetWidth;

    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  }

  return { theme, toggleTheme };
}
