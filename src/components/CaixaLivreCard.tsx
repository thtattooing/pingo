"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { usePrivacy } from "@/hooks/usePrivacy";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface Props {
  checkingBalance: number;
  ccNetFatura: number;
  next30dCC: number;
}

export default function CaixaLivreCard({ checkingBalance, ccNetFatura, next30dCC }: Props) {
  const { hidden } = usePrivacy();
  const caixaLivre = checkingBalance - ccNetFatura - next30dCC;
  const [display, setDisplay] = useState(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (tweenRef.current) tweenRef.current.kill();
    const obj = { val: 0 };
    tweenRef.current = gsap.to(obj, {
      val: caixaLivre,
      duration: 1.2,
      ease: "power3.out",
      onUpdate() { setDisplay(obj.val); },
    });
    return () => { tweenRef.current?.kill(); };
  }, [caixaLivre]);

  const isOk = caixaLivre >= 0;

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{
        background: isOk
          ? "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.08) 100%)"
          : "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(185,28,28,0.08) 100%)",
        border: `1px solid ${isOk ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.25)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <i
            className="fa-solid fa-wallet text-sm"
            style={{ color: isOk ? "#10B981" : "var(--expense)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Caixa Livre
          </p>
        </div>
        <p
          className="mono-data text-xl font-bold"
          style={{
            color: isOk ? "#10B981" : "var(--expense)",
            filter: hidden ? "blur(10px)" : "none",
            transition: "filter 0.3s",
          }}
        >
          {fmt(display)}
        </p>
      </div>

      <div
        className="flex flex-col gap-1 mt-3 pt-3"
        style={{ borderTop: `1px solid ${isOk ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.15)"}` }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            <i className="fa-solid fa-building-columns mr-1.5 text-[10px]" style={{ color: "#8B5CF6" }} />
            Saldo nas contas
          </p>
          <p
            className="mono-data text-[11px] font-semibold"
            style={{ color: "var(--income)", filter: hidden ? "blur(6px)" : "none", transition: "filter 0.3s" }}
          >
            {fmt(checkingBalance)}
          </p>
        </div>
        {ccNetFatura > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              <i className="fa-solid fa-credit-card mr-1.5 text-[10px]" style={{ color: "var(--expense)" }} />
              Fatura atual
            </p>
            <p
              className="mono-data text-[11px] font-semibold"
              style={{ color: "var(--expense)", filter: hidden ? "blur(6px)" : "none", transition: "filter 0.3s" }}
            >
              -{fmt(ccNetFatura)}
            </p>
          </div>
        )}
        {next30dCC > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              <i className="fa-solid fa-calendar-days mr-1.5 text-[10px]" style={{ color: "#F59E0B" }} />
              Parcelas próx. 30 dias
            </p>
            <p
              className="mono-data text-[11px] font-semibold"
              style={{ color: "#F59E0B", filter: hidden ? "blur(6px)" : "none", transition: "filter 0.3s" }}
            >
              -{fmt(next30dCC)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
