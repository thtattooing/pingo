"use client";

import { useRouter } from "next/navigation";

interface Props {
  month: number;
  year: number;
  basePath?: string;
  /** full = wide row with large arrows (home page); compact = small inline (default) */
  variant?: "full" | "compact";
}

export default function MonthNav({ month, year, basePath = "/", variant = "full" }: Props) {
  const router = useRouter();
  const now    = new Date();
  const isNow  = month === now.getMonth() + 1 && year === now.getFullYear();

  const go = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    const nowKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const key    = `${y}-${String(m).padStart(2, "0")}`;
    router.push(key === nowKey ? basePath : `${basePath}${basePath.includes("?") ? "&" : "?"}m=${key}`);
  };

  const label = new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => go(-1)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity active:scale-90"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-chevron-left text-[10px]" style={{ color: "var(--muted-foreground)" }} />
        </button>
        <span className="text-xs px-2.5 py-1 rounded-full mono-data capitalize select-none"
          style={{ background: "var(--input)", color: "var(--muted-foreground)" }}>
          {label}
        </span>
        <button onClick={() => go(+1)} disabled={isNow}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity active:scale-90 disabled:opacity-25"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-chevron-right text-[10px]" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>
    );
  }

  // variant === "full" — barra larga para o home
  return (
    <div className="flex items-center justify-between rounded-2xl px-1 py-1"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => go(-1)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-95 transition-transform"
        style={{ background: "var(--input)" }}
      >
        <i className="fa-solid fa-chevron-left text-sm" style={{ color: "var(--muted-foreground)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Anterior</span>
      </button>

      <span className="text-sm font-semibold capitalize"
        style={{ color: isNow ? "var(--primary)" : "var(--foreground)" }}>
        {label}
        {isNow && <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--muted-foreground)" }}>· atual</span>}
      </span>

      <button
        onClick={() => go(+1)}
        disabled={isNow}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-95 transition-transform disabled:opacity-30"
        style={{ background: "var(--input)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Próximo</span>
        <i className="fa-solid fa-chevron-right text-sm" style={{ color: "var(--muted-foreground)" }} />
      </button>
    </div>
  );
}
