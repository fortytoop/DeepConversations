import { motion, useReducedMotion } from "framer-motion";

function ThemeIcon({
  showMoon,
  clipPathId,
  shapeTransition,
  ...motionProps
}) {
  return (
    <motion.svg
      className="theme-toggle-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...motionProps}
    >
      <clipPath id={clipPathId}>
        <motion.path
          animate={{
            x: showMoon ? -12 : 0,
            y: showMoon ? 10 : 0,
          }}
          transition={shapeTransition}
          d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
        />
      </clipPath>

      <g clipPath={`url(#${clipPathId})`}>
        <motion.circle
          r="8"
          animate={{ scale: showMoon ? 1.25 : 1 }}
          transition={shapeTransition}
          cx="16"
          cy="16"
          style={{ transformOrigin: "16px 16px" }}
        />

        <motion.g
          animate={{
            opacity: showMoon ? 0 : 1,
            rotate: showMoon ? -100 : 0,
            scale: showMoon ? 0.5 : 1,
          }}
          transition={shapeTransition}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M16 5.5v-4" />
          <path d="M16 30.5v-4" />
          <path d="M1.5 16h4" />
          <path d="M26.5 16h4" />
          <path d="m23.4 8.6 2.8-2.8" />
          <path d="m5.7 26.3 2.9-2.9" />
          <path d="m5.8 5.8 2.8 2.8" />
          <path d="m23.4 23.4 2.9 2.9" />
        </motion.g>
      </g>
    </motion.svg>
  );
}

// ThemeToggleButton2 adapted from Skiper UI:
// https://skiper-ui.com/v1/skiper4
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  const showMoon = !isDark;
  const prefersReducedMotion = useReducedMotion();
  const label = `Switch to ${isDark ? "light" : "dark"} mode`;
  const transition = {
    duration: prefersReducedMotion ? 0 : 0.35,
    ease: "easeInOut",
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {prefersReducedMotion ? (
        <>
          <ThemeIcon
            showMoon={false}
            clipPathId="theme-toggle-clip-reduced-sun"
            shapeTransition={{ duration: 0 }}
            initial={false}
            animate={{ opacity: isDark ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
          <ThemeIcon
            showMoon
            clipPathId="theme-toggle-clip-reduced-moon"
            shapeTransition={{ duration: 0 }}
            initial={false}
            animate={{ opacity: isDark ? 0 : 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          />
        </>
      ) : (
        <ThemeIcon
          showMoon={showMoon}
          clipPathId="theme-toggle-clip-morph"
          shapeTransition={transition}
        />
      )}
    </button>
  );
}
