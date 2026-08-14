import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import HomePage from "./pages/HomePage";
import PageNotFound from "./pages/PageNotFound";
import { warmBackend } from "./utils/warmBackend";
import "./App.css";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    void warmBackend();
  }, []);

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <Routes>
        <Route path="/" element={<HomePage theme={theme} />} />
        <Route path="*" element={<PageNotFound theme={theme} />} />
      </Routes>
    </>
  );
}
