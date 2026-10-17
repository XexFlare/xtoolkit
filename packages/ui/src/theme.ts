import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

export const THEME_KEY = "xtoolkit.theme";

export function resolveTheme(stored: string | null, prefersDark: boolean | null): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark === false ? "light" : "dark";
}

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark =
      typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)").matches : null;
    return resolveTheme(stored, prefersDark);
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage blocked: theme still applies for this visit.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return { theme, setTheme, toggleTheme };
}
