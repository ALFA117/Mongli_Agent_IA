import { useCallback, useEffect, useState } from "react";

const KEY = "mongli-theme";

// index.html stamps the theme before first paint; this reads it back and toggles it.
export function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setTheme(t);
  }, []);
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch { /* private mode: this visit only */ }
      return next;
    });
  }, []);
  return { theme, toggle };
}
