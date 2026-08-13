import { useEffect, useState } from "react";

const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme() {
  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getSystemTheme);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const browserBackground = getComputedStyle(root)
      .getPropertyValue("--browser-background")
      .trim();

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", browserBackground);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  }

  return { theme, toggleTheme };
}
