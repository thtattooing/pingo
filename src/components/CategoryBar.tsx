"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Category {
  name: string;
  icon: string;
  amount: number;
  limit?: number;
  color: string;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function CategoryBar({ categories, total }: { categories: Category[]; total: number }) {
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.from(bar, {
        scaleX: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: "power3.out",
        transformOrigin: "left center",
      });
    });
  }, [categories]);

  return (
    <div className="card-pingo flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
        Categorias do mês
      </h3>

      {categories.map((cat, i) => {
        const pct = total > 0 ? (cat.amount / total) * 100 : 0;
        const atLimit = cat.limit && cat.amount >= cat.limit * 0.8;

        return (
          <div key={cat.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: `${cat.color}20` }}
                >
                  <i className={`fa-solid ${cat.icon}`} style={{ color: cat.color }} />
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
                {atLimit && (
                  <i className="fa-solid fa-triangle-exclamation text-xs animate-pulse-alert"
                    style={{ color: "var(--expense)" }} />
                )}
              </div>
              <span className="mono-data text-xs text-[var(--muted-foreground)]">
                {formatBRL(cat.amount)}
              </span>
            </div>

            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--muted)" }}
            >
              <div
                ref={(el) => { if (el) barsRef.current[i] = el; }}
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: atLimit ? "var(--expense)" : cat.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
