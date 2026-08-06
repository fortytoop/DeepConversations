import { useEffect, useRef } from "react";
import { BACKGROUND_ANIMATION_SPEED } from "../constants";

// Draws a soft animated colour field onto the canvas, like a lava lamp
export default function AnimatingBackground({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const pixelSize = 14;
    let animationFrameId;
    let delta = 0;

    function resizeCanvas() {
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
      canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    // Blend sine/cosine waves to create a moving background colour effect for
    // each pixel block
    function getColour(x, y) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const waveX = x * 0.009;
      const waveY = y * 0.009;
      const diagonalWave = (x + y) * 0.006;
      const oppositeDiagonalWave = (x - y) * 0.005;
      const centrePull =
        ((x - width / 2) ** 2 + (y - height / 2) ** 2) / 150000;

      const pinkWave =
        0.7 * Math.sin(waveX + delta) +
        0.45 * Math.cos(diagonalWave - delta * 0.9) +
        0.35 * Math.sin(centrePull + delta * 0.8);

      const purpleWave =
        0.6 * Math.sin(waveY - delta * 1.1) +
        0.45 * Math.cos(oppositeDiagonalWave + delta * 0.7) +
        0.35 * Math.sin(centrePull - delta * 0.6);

      const peachWave =
        0.55 * Math.cos(centrePull + delta * 0.7) +
        0.35 * Math.sin(diagonalWave + delta * 0.5);

      if (theme === "dark") {
        const red = Math.floor(18 + 9 * pinkWave + 4 * peachWave);
        const green = Math.floor(11 + 3 * peachWave - purpleWave);
        const blue = Math.floor(26 + 9 * purpleWave + 2 * pinkWave);

        return `rgb(${red}, ${green}, ${blue})`;
      }

      const red = Math.floor(248 + 4 * pinkWave + 4 * peachWave);
      const green = Math.floor(238 + 5 * peachWave - 4 * purpleWave);
      const blue = Math.floor(250 + 4 * purpleWave - 5 * peachWave);

      return `rgb(${red}, ${green}, ${blue})`;
    }

    function renderFrame() {
      const { innerWidth: width, innerHeight: height } = window;

      for (let x = 0; x < width; x += pixelSize) {
        for (let y = 0; y < height; y += pixelSize) {
          context.fillStyle = getColour(x, y);
          context.fillRect(x, y, pixelSize, pixelSize);
        }
      }

      delta += BACKGROUND_ANIMATION_SPEED;

      // Render only one frame for reduced-motion users, otherwise keep animating
      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    }

    resizeCanvas();
    renderFrame();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="lava-lamp-background"
      aria-hidden="true"
    />
  );
}
