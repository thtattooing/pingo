"use client";

import { usePrivacy } from "@/hooks/usePrivacy";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface Subscription {
  description: string;
  amount: number;
  category: string;
  categoryIcon: string;
  categoryColor: string;
}

interface Props {
  subscriptions: Subscription[];
}

export default function SubscriptionCard({ subscriptions }: Props) {
  const { hidden } = usePrivacy();
  if (subscriptions.length === 0) return null;

  const total = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{
        background: "rgba(251,191,36,0.06)",
        border: "1px solid rgba(251,191,36,0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-rotate text-sm" style={{ color: "var(--gold)" }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Assinaturas
          </p>
        </div>
        <p
          className="mono-data text-sm font-bold"
          style={{ color: "var(--gold)", filter: hidden ? "blur(8px)" : "none", transition: "filter 0.3s" }}
        >
          {fmt(total)}/mês
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {subscriptions.slice(0, 5).map((sub, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${sub.categoryColor}22` }}
              >
                <i className={`fa-solid ${sub.categoryIcon} text-[11px]`} style={{ color: sub.categoryColor }} />
              </div>
              <p
                className="text-xs truncate"
                style={{ color: "var(--foreground)", maxWidth: 160 }}
              >
                {sub.description}
              </p>
            </div>
            <p
              className="mono-data text-xs font-semibold flex-shrink-0 ml-2"
              style={{ color: "var(--expense)", filter: hidden ? "blur(6px)" : "none", transition: "filter 0.3s" }}
            >
              {fmt(sub.amount)}
            </p>
          </div>
        ))}
        {subscriptions.length > 5 && (
          <p className="text-[10px] text-center mt-1" style={{ color: "var(--muted-foreground)" }}>
            +{subscriptions.length - 5} mais
          </p>
        )}
      </div>
    </div>
  );
}
