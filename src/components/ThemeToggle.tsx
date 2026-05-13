"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
      style={{ background: "var(--input)" }}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-sm`}
        style={{ color: "var(--muted-foreground)" }} />
    </button>
  );
}
