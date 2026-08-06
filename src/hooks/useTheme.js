import { useEffect, useState } from "react";

const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme() {
  return window.matchMedia(DARK_MODE_QUERY).matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getSystemTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  }

  return { theme, toggleTheme };
}
