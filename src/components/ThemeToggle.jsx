import { BsMoonStars, BsSun } from "react-icons/bs";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {isDark ? <BsSun aria-hidden="true" /> : <BsMoonStars aria-hidden="true" />}
    </button>
  );
}
