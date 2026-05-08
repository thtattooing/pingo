"use client";

import { CATEGORIES } from "@/lib/categories";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="card-pingo flex flex-col items-center gap-3 py-8 text-center">
        <i className="fa-solid fa-receipt text-3xl" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma transação ainda</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Use o chat ou importe um extrato
        </p>
      </div>
    );
  }

  return (
    <div className="card-pingo flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
        Últimas transações
      </h3>

      {transactions.map((tx, i) => {
        const cat = CATEGORIES.find((c) => c.id === tx.category) ?? CATEGORIES[0];
        const isIncome = tx.type === "income";

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-3 border-b last:border-b-0 animate-fade-in-up"
            style={{
              borderColor: "var(--border)",
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${cat.color}20` }}
            >
              <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {cat.name} · {formatDate(tx.date)}
              </p>
            </div>

            <span
              className="mono-data text-sm font-medium flex-shrink-0"
              style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}
            >
              {isIncome ? "+" : "-"}{formatBRL(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
