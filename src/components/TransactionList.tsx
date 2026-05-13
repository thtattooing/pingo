"use client";

import { CATEGORIES } from "@/lib/categories";
import { BRL, formatDate } from "@/lib/formatters";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  accountType?: string;
  accountName?: string;
  isRecurring?: boolean;
  subcategory?: string;
  installments?: number;
  installmentCurrent?: number;
  isShared?: boolean;
}

function AccountBadge({ type, name }: { type?: string; name?: string }) {
  if (!name) return null;
  const isCredit = type === "credit_card";
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
      style={{
        background: isCredit ? "rgba(244,114,182,0.12)" : "rgba(99,102,241,0.12)",
        color:      isCredit ? "var(--primary)" : "#8B5CF6",
      }}
    >
      <i className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"}`} style={{ fontSize: 8 }} />
      {name}
    </span>
  );
}

export default function TransactionList({
  transactions,
  onEdit,
  title = "Últimas transações",
}: {
  transactions: Transaction[];
  onEdit?: (tx: Transaction) => void;
  title?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="card-pingo flex flex-col items-center gap-3 py-8 text-center">
        <i className="fa-solid fa-receipt text-3xl" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma transação ainda</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Use o lançamento ou importe um extrato
        </p>
      </div>
    );
  }

  return (
    <div className="card-pingo flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </h3>

      {transactions.map((tx, i) => {
        const cat = CATEGORIES.find((c) => c.id === tx.category) ?? CATEGORIES[CATEGORIES.length - 1];
        const isIncome = tx.type === "income";
        const hasInstallments = typeof tx.installments === "number" && tx.installments > 1;

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-3 border-b last:border-b-0 animate-fade-in-up"
            style={{ borderColor: "var(--border)", animationDelay: `${i * 0.04}s` }}
            onClick={() => onEdit?.(tx)}
            role={onEdit ? "button" : undefined}
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${cat.color}20` }}
            >
              <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium truncate max-w-[150px]">{tx.description}</p>
                {tx.isRecurring && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
                    style={{ background: "rgba(251,191,36,0.15)", color: "var(--gold)" }}>
                    recorrente
                  </span>
                )}
                {hasInstallments && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#A78BFA" }}>
                    {tx.installmentCurrent}/{tx.installments}x
                  </span>
                )}
                {tx.isShared && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
                    style={{ background: "rgba(244,114,182,0.12)", color: "var(--primary)" }}>
                    casal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {tx.subcategory ? tx.subcategory : cat.name} · {formatDate(tx.date)}
                </p>
                <AccountBadge type={tx.accountType} name={tx.accountName} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="mono-data text-sm font-medium"
                style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}
              >
                {isIncome ? "+" : "-"}{BRL(tx.amount)}
              </span>
              {onEdit && (
                <i className="fa-solid fa-chevron-right text-xs opacity-30" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
