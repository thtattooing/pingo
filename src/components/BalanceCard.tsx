"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrivacy } from "@/hooks/usePrivacy";

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
  userName: string;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function BalanceCard({ balance, income, expense, userName }: BalanceCardProps) {
  const balanceRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { hidden } = usePrivacy();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!balanceRef.current) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: balance,
      duration: 1.4,
      ease: "power3.out",
      onUpdate() {
        setDisplayValue(obj.val);
      },
    });

    gsap.from(cardRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    });
  }, [balance]);

  const diff = income - expense;
  const diffPct = income > 0 ? Math.round((diff / income) * 100) : 0;
  const isPositive = diff >= 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const firstName = userName?.split(" ")[0] ?? "você";

  return (
    <div ref={cardRef} className="card-pingo relative overflow-hidden">
      {/* Gradiente decorativo */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[var(--muted-foreground)] text-sm">
            {greeting}, {firstName}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Saldo atual
          </p>
        </div>
      </div>

      {/* Saldo principal */}
      <div className="mb-5">
        <span
          ref={balanceRef}
          className="balance-text text-4xl font-normal tracking-tight"
          style={{ filter: hidden ? "blur(12px)" : "none", transition: "filter 0.3s" }}
        >
          {formatBRL(displayValue)}
        </span>
      </div>

      {/* Entradas e Saídas */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-arrow-down text-xs text-income" />
            <span className="text-xs text-[var(--muted-foreground)]">Entradas</span>
          </div>
          <span
            className="mono-data text-sm font-medium text-income"
            style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter 0.3s" }}
          >
            {formatBRL(income)}
          </span>
        </div>

        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-arrow-up text-xs text-expense" />
            <span className="text-xs text-[var(--muted-foreground)]">Saídas</span>
          </div>
          <span
            className="mono-data text-sm font-medium text-expense"
            style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter 0.3s" }}
          >
            {formatBRL(expense)}
          </span>
        </div>
      </div>

      {/* Variação mensal */}
      {diff !== 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <i
            className={`fa-solid ${isPositive ? "fa-trending-up" : "fa-trending-down"} text-xs`}
            style={{ color: isPositive ? "var(--income)" : "var(--expense)" }}
          />
          <span
            className="mono-data text-xs"
            style={{ color: isPositive ? "var(--income)" : "var(--expense)" }}
          >
            {isPositive ? "+" : ""}{diffPct}% este mês
          </span>
        </div>
      )}
    </div>
  );
}
