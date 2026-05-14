"use client";

import { CATEGORIES } from "@/lib/categories";
import { BRL } from "@/lib/formatters";
import { usePrivacy } from "@/hooks/usePrivacy";

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
  txType?: string;
}

function datLabel(dateStr: string): string {
  const today     = new Date().toISOString().split("T")[0];
  const d         = new Date(dateStr + "T12:00:00");
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today)     return "Hoje";
  if (dateStr === yesterday) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });
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
  const { hidden } = usePrivacy();

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

  // Group by date
  const groups = new Map<string, Transaction[]>();
  transactions.forEach(tx => {
    if (!groups.has(tx.date)) groups.set(tx.date, []);
    groups.get(tx.date)!.push(tx);
  });
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--muted-foreground)" }}>
        {title}
      </p>

      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-0">
          {/* Date group header */}
          <div className="flex items-center gap-2 py-2 sticky top-0 z-10"
            style={{ background: "var(--background)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
              {datLabel(date)}
            </p>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Transactions */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {groups.get(date)!.map((tx, i, arr) => {
              const cat         = CATEGORIES.find(c => c.id === tx.category) ?? CATEGORIES[CATEGORIES.length - 1];
              const isIncome    = tx.type === "income";
              const hasInstall  = typeof tx.installments === "number" && tx.installments > 1;
              const isLast      = i === arr.length - 1;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 animate-fade-in-up transition-colors active:opacity-70"
                  style={{
                    borderBottom: isLast ? "none" : `1px solid var(--border)`,
                    animationDelay: `${i * 0.04}s`,
                    cursor: onEdit ? "pointer" : "default",
                  }}
                  onClick={() => onEdit?.(tx)}
                  role={onEdit ? "button" : undefined}
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat.color}22` }}
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
                      {hasInstall && (
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
                        {tx.subcategory ? tx.subcategory : cat.name}
                      </p>
                      <AccountBadge type={tx.accountType} name={tx.accountName} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="mono-data text-sm font-semibold"
                      style={{
                        color: isIncome ? "var(--income)" : "var(--expense)",
                        filter: hidden ? "blur(6px)" : "none",
                        transition: "filter 0.3s",
                      }}
                    >
                      {isIncome ? "+" : "-"}{BRL(tx.amount)}
                    </span>
                    {onEdit && <i className="fa-solid fa-chevron-right text-xs opacity-30" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
