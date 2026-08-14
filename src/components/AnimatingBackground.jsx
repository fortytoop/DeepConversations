import { useEffect, useRef } from "react";

// Test no animating backgrounds
const ANIMATED_BACKGROUND_ENABLED =
  !import.meta.env.DEV ||
  import.meta.env.VITE_ANIMATED_BACKGROUND_ENABLED !== "false";

function getCssColour(styles, property) {
  const value = styles.getPropertyValue(property).trim();
  return Number.parseInt(value.replace("#", ""), 16);
}

// Mounts Vanta's Fog effect as a document-sized animated background.
export default function AnimatingBackground({ theme }) {
  const backgroundRef = useRef(null);

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

        const styles = getComputedStyle(document.documentElement);
        effect = createFogEffect({
          el: background,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          highlightColor: getCssColour(styles, "--vanta-highlight"),
          midtoneColor: getCssColour(styles, "--vanta-midtone"),
          lowlightColor: getCssColour(styles, "--vanta-lowlight"),
          baseColor: getCssColour(styles, "--vanta-base"),
          blurFactor: 0.9,
          speed: 1.35,
          zoom: mobileQuery.matches ? 0.15 : 0.3,
          scale: 1.5,
          scaleMobile: 2,
        });

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
      effect?.destroy();
    };
  }, [theme]);

  return (
    <div
      ref={backgroundRef}
      className="vanta-background"
      aria-hidden="true"
    />
  );
}
