"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { BRL, formatDate } from "@/lib/formatters";
import EditTransactionModal from "@/components/EditTransactionModal";
import type { Transaction } from "@/components/TransactionList";

export default function TransacoesClient({
  initialTransactions,
  onRefresh,
  userId,
}: {
  initialTransactions: Transaction[];
  onRefresh?: () => void;
  userId?: string;
}) {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState<"all"|"income"|"expense">("all");
  const [filterCat, setFilterCat]   = useState<string>("all");
  const [editTx, setEditTx]         = useState<Transaction | null>(null);
  const [txList, setTxList]         = useState(initialTransactions);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return txList.filter(tx => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterCat !== "all" && tx.category !== filterCat) return false;
      if (q && !tx.description.toLowerCase().includes(q) && !tx.accountName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [txList, search, filterType, filterCat]);

  const income  = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  async function handleSaved() {
    router.refresh();
  }

  return (
    <>
      {/* Search bar */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <i className="fa-solid fa-magnifying-glass text-sm" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }} />
          {search && (
            <button onClick={() => setSearch("")}>
              <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 px-5 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([
          { id: "all", label: "Todos" },
          { id: "expense", label: "Saídas" },
          { id: "income",  label: "Entradas" },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilterType(f.id)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterType === f.id ? "var(--primary)" : "var(--card)",
              color: filterType === f.id ? "#fff" : "var(--muted-foreground)",
              border: filterType === f.id ? "none" : "1px solid var(--border)",
            }}>
            {f.label}
          </button>
        ))}

        {CATEGORIES.slice(0, 6).map(c => (
          <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterCat === c.id ? `${c.color}25` : "var(--card)",
              color: filterCat === c.id ? c.color : "var(--muted-foreground)",
              border: filterCat === c.id ? `1px solid ${c.color}50` : "1px solid var(--border)",
            }}>
            <i className={`fa-solid ${c.icon}`} style={{ fontSize: 10 }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Summary mini */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-4">
        <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Entradas filtradas</p>
          <p className="mono-data text-sm font-semibold" style={{ color: "var(--income)" }}>{BRL(income)}</p>
        </div>
        <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Saídas filtradas</p>
          <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>{BRL(expense)}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-5 flex flex-col gap-0">
        {filtered.length === 0 && (
          <div className="card-pingo flex flex-col items-center gap-3 py-8 text-center">
            <i className="fa-solid fa-search text-3xl" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma transação encontrada</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="card-pingo flex flex-col gap-1">
            <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
              {filtered.length} transação{filtered.length !== 1 ? "ões" : ""}
            </p>
            {filtered.map((tx, i) => {
              const cat = CATEGORIES.find(c => c.id === tx.category) ?? CATEGORIES[CATEGORIES.length - 1];
              const isIncome = tx.type === "income";
              return (
                <button key={tx.id} onClick={() => setEditTx(tx)}
                  className="flex items-center gap-3 py-3 border-b last:border-b-0 text-left w-full animate-fade-in-up"
                  style={{ borderColor: "var(--border)", animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cat.color}20` }}>
                    <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate max-w-[160px]">{tx.description}</p>
                      {tx.isShared && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(244,114,182,0.12)", color: "var(--primary)" }}>casal</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {cat.name} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <span className="mono-data text-sm font-medium flex-shrink-0"
                    style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}>
                    {isIncome ? "+" : "-"}{BRL(tx.amount)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          userId={userId}
          onClose={() => setEditTx(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
