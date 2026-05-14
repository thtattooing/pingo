"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { BRL, formatDate } from "@/lib/formatters";
import EditTransactionModal from "@/components/EditTransactionModal";
import type { Transaction } from "@/components/TransactionList";

export default function TransacoesClient({
  initialTransactions,
  userId,
}: {
  initialTransactions: Transaction[];
  onRefresh?: () => void;
  userId?: string;
}) {
  const router = useRouter();
  const [search, setSearch]               = useState("");
  const [filterType, setFilterType]       = useState<"all"|"income"|"expense"|"transfer">("all");
  const [filterCat, setFilterCat]         = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [showFilters, setShowFilters]     = useState(false);
  const [editTx, setEditTx]               = useState<Transaction | null>(null);
  const [txList]                          = useState(initialTransactions);

  const accounts = useMemo(() => {
    const seen = new Set<string>();
    return txList
      .filter(t => t.accountName)
      .reduce<{ name: string; type: string }[]>((acc, t) => {
        const k = t.accountName!;
        if (!seen.has(k)) { seen.add(k); acc.push({ name: k, type: t.accountType ?? "checking" }); }
        return acc;
      }, []);
  }, [txList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return txList.filter(tx => {
      const isTransfer = tx.txType === "transfer_internal";
      // Transfer filter: show ONLY transfers, or hide transfers when not in transfer mode
      if (filterType === "transfer") { if (!isTransfer) return false; }
      else { if (isTransfer) return false; }
      if (filterType !== "all" && filterType !== "transfer" && tx.type !== filterType) return false;
      if (filterCat !== "all" && tx.category !== filterCat) return false;
      if (filterAccount !== "all" && tx.accountName !== filterAccount) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (q && !tx.description.toLowerCase().includes(q) && !tx.accountName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [txList, search, filterType, filterCat, filterAccount, dateFrom, dateTo]);

  const income  = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const hasActiveFilter = filterType !== "all" || filterCat !== "all" || filterAccount !== "all" || !!dateFrom || !!dateTo;
  const isTransferView = filterType === "transfer";

  function clearFilters() {
    setFilterType("all"); setFilterCat("all"); setFilterAccount("all");
    setDateFrom(""); setDateTo("");
  }

  return (
    <>
      {/* Search + filter toggle */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
            style={{
              background: showFilters || hasActiveFilter ? "rgba(244,114,182,0.15)" : "var(--input)",
              color: showFilters || hasActiveFilter ? "var(--primary)" : "var(--muted-foreground)",
              border: `1px solid ${showFilters || hasActiveFilter ? "rgba(244,114,182,0.3)" : "transparent"}`,
            }}>
            <i className="fa-solid fa-sliders text-xs" />
            {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />}
          </button>
        </div>
      </div>

      {/* Type pills */}
      <div className="flex gap-2 px-5 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {([
          { id: "all",      label: "Todos" },
          { id: "expense",  label: "Saídas" },
          { id: "income",   label: "Entradas" },
          { id: "transfer", label: "Transferências" },
        ] as const).map(f => {
          const isSelected = filterType === f.id;
          const isTransfer = f.id === "transfer";
          return (
            <button key={f.id}
              onClick={() => setFilterType(f.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: isSelected ? (isTransfer ? "#6366F1" : "var(--primary)") : "var(--card)",
                color:      isSelected ? "#fff" : "var(--muted-foreground)",
                border:     isSelected ? "none" : "1px solid var(--border)",
              }}>
              {isTransfer && <i className="fa-solid fa-right-left text-[9px]" />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="px-5 mb-4 flex flex-col gap-3 animate-fade-in-up">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Data inicial</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Data final</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
          </div>

          {/* Account filter */}
          {accounts.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Conta / Cartão</label>
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <button onClick={() => setFilterAccount("all")}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: filterAccount === "all" ? "var(--primary)" : "var(--card)",
                    color: filterAccount === "all" ? "#fff" : "var(--muted-foreground)",
                    border: filterAccount === "all" ? "none" : "1px solid var(--border)",
                  }}>Todas</button>
                {accounts.map(acc => (
                  <button key={acc.name} onClick={() => setFilterAccount(acc.name)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: filterAccount === acc.name ? "rgba(139,92,246,0.15)" : "var(--card)",
                      color: filterAccount === acc.name ? "#8B5CF6" : "var(--muted-foreground)",
                      border: filterAccount === acc.name ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--border)",
                    }}>
                    <i className={`fa-solid ${acc.type === "credit_card" ? "fa-credit-card" : "fa-building-columns"} text-[9px]`} />
                    <span className="max-w-[90px] truncate">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category filter — all categories */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Categoria</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterCat("all")}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: filterCat === "all" ? "var(--primary)" : "var(--card)",
                  color: filterCat === "all" ? "#fff" : "var(--muted-foreground)",
                  border: filterCat === "all" ? "none" : "1px solid var(--border)",
                }}>Todas</button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: filterCat === c.id ? `${c.color}25` : "var(--card)",
                    color: filterCat === c.id ? c.color : "var(--muted-foreground)",
                    border: filterCat === c.id ? `1px solid ${c.color}50` : "1px solid var(--border)",
                  }}>
                  <i className={`fa-solid ${c.icon}`} style={{ fontSize: 9 }} />
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs self-end flex items-center gap-1.5"
              style={{ color: "var(--muted-foreground)" }}>
              <i className="fa-solid fa-xmark" />Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {isTransferView ? (
        <div className="grid grid-cols-2 gap-3 px-5 mb-4">
          <div className="rounded-2xl px-4 py-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Saídas</p>
            <p className="mono-data text-sm font-semibold" style={{ color: "#6366F1" }}>{BRL(expense)}</p>
          </div>
          <div className="rounded-2xl px-4 py-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Entradas</p>
            <p className="mono-data text-sm font-semibold" style={{ color: "#6366F1" }}>{BRL(income)}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 mb-4">
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Entradas</p>
            <p className="mono-data text-sm font-semibold" style={{ color: "var(--income)" }}>{BRL(income)}</p>
          </div>
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Saídas</p>
            <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>{BRL(expense)}</p>
          </div>
        </div>
      )}

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
              {filtered.length} transaç{filtered.length !== 1 ? "ões" : "ão"}
            </p>
            {filtered.map((tx, i) => {
              const isTransfer = tx.txType === "transfer_internal";
              const cat = CATEGORIES.find(c => c.id === tx.category) ?? CATEGORIES[CATEGORIES.length - 1];
              const isIncome = tx.type === "income";
              return (
                <button key={tx.id} onClick={() => setEditTx(tx)}
                  className="flex items-center gap-3 py-3 border-b last:border-b-0 text-left w-full animate-fade-in-up"
                  style={{ borderColor: "var(--border)", animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isTransfer ? "rgba(99,102,241,0.12)" : `${cat.color}20` }}>
                    <i className={`fa-solid ${isTransfer ? "fa-right-left" : cat.icon} text-sm`}
                      style={{ color: isTransfer ? "#6366F1" : cat.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate max-w-[150px]">{tx.description}</p>
                      {tx.isShared && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(244,114,182,0.12)", color: "var(--primary)" }}>casal</span>
                      )}
                      {isTransfer && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}>transferência</span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {isTransfer ? "Transferência interna" : cat.name} · {formatDate(tx.date)}
                      {tx.accountName && <> · {tx.accountName}</>}
                    </p>
                  </div>
                  <span className="mono-data text-sm font-medium flex-shrink-0"
                    style={{ color: isTransfer ? "#6366F1" : (isIncome ? "var(--income)" : "var(--expense)") }}>
                    {isTransfer ? (isIncome ? "+" : "−") : (isIncome ? "+" : "-")}{BRL(tx.amount)}
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
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
