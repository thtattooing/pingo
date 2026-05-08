"use client";

import { useRouter } from "next/navigation";

interface Props {
  month: number;
  year: number;
  basePath?: string;
}

export default function MonthNav({ month, year, basePath = "/" }: Props) {
  const router = useRouter();
  const now    = new Date();
  const isNow  = month === now.getMonth() + 1 && year === now.getFullYear();

  const go = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    const key = `${y}-${String(m).padStart(2, "0")}`;
    router.push(key === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`
      ? basePath
      : `${basePath}?m=${key}`);
  };

  const label = new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => go(-1)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity active:scale-90"
        style={{ background: "var(--input)" }}
        aria-label="Mês anterior"
      >
        <i className="fa-solid fa-chevron-left text-[10px]" style={{ color: "var(--muted-foreground)" }} />
      </button>

      <span
        className="text-xs px-2.5 py-1 rounded-full mono-data capitalize select-none"
        style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
      >
        {label}
      </span>

      <button
        onClick={() => go(+1)}
        disabled={isNow}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity active:scale-90 disabled:opacity-25"
        style={{ background: "var(--input)" }}
        aria-label="Próximo mês"
      >
        <i className="fa-solid fa-chevron-right text-[10px]" style={{ color: "var(--muted-foreground)" }} />
      </button>
    </div>
  );
}
