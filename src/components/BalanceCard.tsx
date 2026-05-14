"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrivacy } from "@/hooks/usePrivacy";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
  userName: string;
}

export default function BalanceCard({ balance, income, expense, userName }: BalanceCardProps) {
  const cardRef    = useRef<HTMLDivElement>(null);
  const { hidden } = usePrivacy();
  const [displayValue, setDisplayValue] = useState(0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = userName?.split(" ")[0] ?? "você";

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: balance,
      duration: 1.5,
      ease: "power3.out",
      onUpdate() { setDisplayValue(obj.val); },
    });
    if (cardRef.current) {
      gsap.from(cardRef.current, { y: 20, opacity: 0, duration: 0.5, ease: "power3.out" });
    }
  }, [balance]);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: "linear-gradient(135deg, #EC4899 0%, #9333EA 65%, #6366F1 100%)",
        boxShadow: "0 12px 40px rgba(236,72,153,0.35)",
        padding: "1.5rem",
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -50, right: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "10%", width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

      {/* Greeting */}
      <div className="relative z-10 mb-5">
        <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest">{greeting}</p>
        <p className="text-white font-semibold text-base leading-tight">{firstName}</p>
      </div>

      {/* Balance */}
      <div className="relative z-10 mb-6">
        <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mb-1">Saldo do mês</p>
        <span
          className="balance-text font-normal tracking-tight text-white"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 3.5rem)",
            filter: hidden ? "blur(14px)" : "none",
            transition: "filter 0.3s",
            display: "block",
          }}
        >
          {formatBRL(displayValue)}
        </span>
      </div>

      {/* Stats row */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <i className="fa-solid fa-arrow-down text-white" style={{ fontSize: 8 }} />
            </div>
            <span className="text-white/60 text-[9px] font-semibold uppercase tracking-wider">Entradas</span>
          </div>
          <span
            className="mono-data text-sm font-semibold text-white"
            style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter 0.3s" }}
          >
            {formatBRL(income)}
          </span>
        </div>

        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <i className="fa-solid fa-arrow-up text-white" style={{ fontSize: 8 }} />
            </div>
            <span className="text-white/60 text-[9px] font-semibold uppercase tracking-wider">Saídas</span>
          </div>
          <span
            className="mono-data text-sm font-semibold text-white"
            style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter 0.3s" }}
          >
            {formatBRL(expense)}
          </span>
        </div>
      </div>
    </div>
  );
}
