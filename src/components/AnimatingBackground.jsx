import { useEffect, useRef } from "react";
import { THEME_TRANSITION_MS } from "../constants";

// Test no animating backgrounds
const ANIMATED_BACKGROUND_ENABLED =
  !import.meta.env.DEV ||
  import.meta.env.VITE_ANIMATED_BACKGROUND_ENABLED !== "false";

function getCssColour(styles, property) {
  const value = styles.getPropertyValue(property).trim();
  return Number.parseInt(value.replace("#", ""), 16);
}

function getVantaColours(styles) {
  return {
    highlightColor: getCssColour(styles, "--vanta-highlight"),
    midtoneColor: getCssColour(styles, "--vanta-midtone"),
    lowlightColor: getCssColour(styles, "--vanta-lowlight"),
    baseColor: getCssColour(styles, "--vanta-base"),
  };
}

function interpolateColour(startingColour, targetColour, progress) {
  const startingRed = (startingColour >> 16) & 0xff;
  const startingGreen = (startingColour >> 8) & 0xff;
  const startingBlue = startingColour & 0xff;
  const targetRed = (targetColour >> 16) & 0xff;
  const targetGreen = (targetColour >> 8) & 0xff;
  const targetBlue = targetColour & 0xff;

  const red = Math.round(startingRed + (targetRed - startingRed) * progress);
  const green = Math.round(
    startingGreen + (targetGreen - startingGreen) * progress,
  );
  const blue = Math.round(
    startingBlue + (targetBlue - startingBlue) * progress,
  );

  return (red << 16) | (green << 8) | blue;
}

function interpolateVantaColours(startingColours, targetColours, progress) {
  return {
    highlightColor: interpolateColour(
      startingColours.highlightColor,
      targetColours.highlightColor,
      progress,
    ),
    midtoneColor: interpolateColour(
      startingColours.midtoneColor,
      targetColours.midtoneColor,
      progress,
    ),
    lowlightColor: interpolateColour(
      startingColours.lowlightColor,
      targetColours.lowlightColor,
      progress,
    ),
    baseColor: interpolateColour(
      startingColours.baseColor,
      targetColours.baseColor,
      progress,
    ),
  };
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress ** 3
    : 1 - (-2 * progress + 2) ** 3 / 2;
}

function coloursMatch(firstColours, secondColours) {
  return (
    firstColours.highlightColor === secondColours.highlightColor &&
    firstColours.midtoneColor === secondColours.midtoneColor &&
    firstColours.lowlightColor === secondColours.lowlightColor &&
    firstColours.baseColor === secondColours.baseColor
  );
}

// Mounts Vanta's Fog effect as a document-sized animated background.
export default function AnimatingBackground({ theme }) {
  const backgroundRef = useRef(null);
  const effectRef = useRef(null);
  const currentColoursRef = useRef(null);
  const themeTransitionFrameRef = useRef(null);

  useEffect(() => {
    if (!ANIMATED_BACKGROUND_ENABLED) return undefined;

    const background = backgroundRef.current;
    if (!background) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Fallback to static CSS specified colour
    if (prefersReducedMotion) return undefined;

    const mobileQuery = window.matchMedia(
      "(max-width: 640px), (hover: none) and (pointer: coarse)",
    );


    let effect;
    let handleStableResize;
    let resizeFrameId;
    let disposed = false;

    async function initialiseEffect() {
      try {
        const [THREE, fogModule] = await Promise.all([
          import("three"),
          import("vanta/dist/vanta.fog.min"),
        ]);

        if (disposed) return;

        const createFogEffect =
          fogModule.default?.default ?? fogModule.default ?? fogModule;

        if (typeof createFogEffect !== "function") {
          throw new TypeError("Vanta Fog module did not export a function");
        }

        const initialColours = getVantaColours(
          getComputedStyle(document.documentElement),
        );
        effect = createFogEffect({
          el: background,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          ...initialColours,
          blurFactor: 0.9,
          speed: 1.35,
          zoom: mobileQuery.matches ? 0.15 : 0.3,
          scale: 1.5,
          scaleMobile: 2,
        });
        effectRef.current = effect;
        currentColoursRef.current = initialColours;

        // Vanta resizes its WebGL renderer on every viewport-height change.
        // Mobile Safari changes that height while its browser bars collapse,
        // which can make the canvas flash during an otherwise normal scroll.
        window.removeEventListener("resize", effect.resize);

        let previousViewportWidth = window.innerWidth;
        handleStableResize = () => {
          if (window.innerWidth === previousViewportWidth) return;

          previousViewportWidth = window.innerWidth;
          window.cancelAnimationFrame(resizeFrameId);
          resizeFrameId = window.requestAnimationFrame(() => {
            effect.setOptions({
              zoom: mobileQuery.matches ? 0.15 : 0.3,
            });
            effect.resize();
          });
        };

        window.addEventListener("resize", handleStableResize, {
          passive: true,
        });
      } catch (error) {
        if (!disposed) {
          console.error("Vanta background failed to initialise:", error);
        }
      }
    }

    initialiseEffect();

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleStableResize);
      window.cancelAnimationFrame(resizeFrameId);
      window.cancelAnimationFrame(themeTransitionFrameRef.current);
      effectRef.current = null;
      currentColoursRef.current = null;
      effect?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!ANIMATED_BACKGROUND_ENABLED) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return undefined;

    const effect = effectRef.current;
    const startingColours = currentColoursRef.current;
    if (!effect || !startingColours) return undefined;

    const targetColours = getVantaColours(
      getComputedStyle(document.documentElement),
    );
    if (coloursMatch(startingColours, targetColours)) return undefined;

    const transitionStartedAt = performance.now();

    function updateColours(currentTime) {
      const progress = Math.min(
        (currentTime - transitionStartedAt) / THEME_TRANSITION_MS,
        1,
      );
      const interpolatedColours = interpolateVantaColours(
        startingColours,
        targetColours,
        easeInOutCubic(progress),
      );

      effect.setOptions(interpolatedColours);
      currentColoursRef.current = interpolatedColours;

      if (progress < 1) {
        themeTransitionFrameRef.current =
          window.requestAnimationFrame(updateColours);
      } else {
        themeTransitionFrameRef.current = null;
      }
    }

    themeTransitionFrameRef.current =
      window.requestAnimationFrame(updateColours);

    return () => {
      window.cancelAnimationFrame(themeTransitionFrameRef.current);
      themeTransitionFrameRef.current = null;
    };
  }, [theme]);

  return (
    <div
      ref={backgroundRef}
      className="vanta-background"
      aria-hidden="true"
    >
      <div className="vanta-theme-overlay vanta-theme-overlay-light" />
      <div className="vanta-theme-overlay vanta-theme-overlay-dark" />
      <div className="reduced-background-layer reduced-background-light" />
      <div className="reduced-background-layer reduced-background-dark" />
    </div>
  );
}
