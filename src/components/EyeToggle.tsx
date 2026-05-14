"use client";
import { usePrivacy } from "@/hooks/usePrivacy";

export default function EyeToggle({ className }: { className?: string }) {
  const { hidden, toggle } = usePrivacy();
  return (
    <button
      onClick={toggle}
      aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
      className={className}
      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
    >
      <i
        className={`fa-solid ${hidden ? "fa-eye-slash" : "fa-eye"} text-base`}
        style={{ color: "var(--muted-foreground)" }}
      />
    </button>
  );
}
