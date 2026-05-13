"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BRL } from "@/lib/formatters";
import { CATEGORIES } from "@/lib/categories";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  date: string;
  txType: string;
  installments: number;
  installmentCurrent: number;
  isRecurring: boolean;
}

interface Props {
  accountName: string;
  accountType: "checking" | "savings";
  color: string;
  icon: string;
  initialBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}

const TX_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  pix_in:             { label: "PIX recebido",  icon: "fa-bolt",              color: "#10B981" },
  pix_out:            { label: "PIX enviado",   icon: "fa-bolt",              color: "#3B82F6" },
  salary:             { label: "Salário",        icon: "fa-money-bill-wave",   color: "#059669" },
  transfer_in:        { label: "Transf. recebida", icon: "fa-arrow-right-to-bracket", color: "#06B6D4" },
  transfer_out:       { label: "Transf. enviada",  icon: "fa-arrow-right-from-bracket", color: "#8B5CF6" },
  transfer_internal:  { label: "Entre contas",   icon: "fa-arrows-rotate",     color: "#64748B" },
  boleto:             { label: "Boleto/Pagamento", icon: "fa-barcode",          color: "#F59E0B" },
  fee:                { label: "Tarifa",          icon: "fa-building-columns",  color: "#EF4444" },
  debit:              { label: "Débito",          icon: "fa-credit-card",       color: "#F97316" },
  credit:             { label: "Crédito",         icon: "fa-circle-arrow-down", color: "#10B981" },
  deposit:            { label: "Depósito",        icon: "fa-piggy-bank",        color: "#059669" },
  withdrawal:         { label: "Saque",           icon: "fa-money-bill",        color: "#EF4444" },
  unknown:            { label: "Outros",          icon: "fa-ellipsis",          color: "#64748B" },
};

const FILTER_OPTIONS = [
  { key: "all",               label: "Tudo" },
  { key: "pix_in",            label: "PIX entrada" },
  { key: "pix_out",           label: "PIX saída" },
  { key: "salary",            label: "Salário" },
  { key: "transfer_in",       label: "TED/Transf." },
  { key: "boleto",            label: "Boletos" },
  { key: "fee",               label: "Tarifas" },
  { key: "transfer_internal", label: "Entre contas" },
];

function groupByMonth(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  txs.forEach(t => {
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return map;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[m - 1]} ${y}`;
}

export default function ContaDetailClient({
  accountName,
  accountType,
  color,
  icon,
  initialBalance,
  currentBalance,
  totalIncome,
  totalExpense,
  transactions,
}: Props) {
  const router = useRouter();
  const [filter, setFilter]        = useState("all");
  const [search, setSearch]        = useState("");
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);

  const groupedAll = useMemo(() => groupByMonth(transactions), [transactions]);
  const availableMonths = useMemo(() =>
    Array.from(groupedAll.keys()).sort((a, b) => b.localeCompare(a)),
    [groupedAll]
  );

  const selectedMonth = availableMonths[selectedMonthIdx] ?? "";
  const monthTxs = useMemo(() => groupedAll.get(selectedMonth) ?? [], [groupedAll, selectedMonth]);

  const monthIncome = useMemo(() =>
    monthTxs.filter(t => t.type === "income"  && t.txType !== "transfer_internal").reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  );
  const monthExpense = useMemo(() =>
    monthTxs.filter(t => t.type === "expense" && t.txType !== "transfer_internal").reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  );

  const filtered = useMemo(() => {
    let list = monthTxs;
    if (filter !== "all") list = list.filter(t => t.txType === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q));
    }
    return list;
  }, [monthTxs, filter, search]);

  const grad = `linear-gradient(135deg, ${color}bb 0%, ${color} 100%)`;

  return (
    <>
      {/* Header card */}
      <div className="relative mx-0" style={{ background: grad, minHeight: 180 }}>
        <div className="absolute inset-0 opacity-15"
          style={{ background: "radial-gradient(ellipse at 80% 20%, #fff 0%, transparent 60%)" }} />

        <div className="relative z-10 px-5 pt-12 pb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <i className="fa-solid fa-arrow-left text-white text-sm" />
          </button>

          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                {accountType === "savings" ? "Poupança" : "Conta Corrente"}
              </p>
              <p className="text-white font-bold text-lg">{accountName}</p>
            </div>
            <i className={`fa-solid ${icon} text-white/40 text-2xl`} />
          </div>

          <div className="mt-3">
            <p className="text-white/60 text-[10px] mb-0.5">Saldo atual</p>
            <p className="text-white text-3xl font-bold mono-data">{BRL(currentBalance)}</p>
          </div>

          {/* Income / Expense mini stats */}
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-wide">Entradas</p>
              <p className="text-white/90 text-sm font-semibold mono-data">+{BRL(totalIncome)}</p>
            </div>
            <div className="w-px" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-wide">Saídas</p>
              <p className="text-white/90 text-sm font-semibold mono-data">-{BRL(totalExpense)}</p>
            </div>
            {initialBalance !== 0 && (
              <>
                <div className="w-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                <div>
                  <p className="text-white/50 text-[9px] uppercase tracking-wide">Saldo inicial</p>
                  <p className="text-white/90 text-sm font-semibold mono-data">{BRL(initialBalance)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-4 px-5 pt-4 pb-4">

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <i className="fa-solid fa-magnifying-glass text-xs" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transação…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <i className="fa-solid fa-xmark text-xs" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        {/* Month navigation */}
        {availableMonths.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl px-1 py-1"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setSelectedMonthIdx(i => Math.min(i + 1, availableMonths.length - 1))}
              disabled={selectedMonthIdx >= availableMonths.length - 1}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-transform active:scale-95 disabled:opacity-30"
              style={{ background: "var(--input)" }}>
              <i className="fa-solid fa-chevron-left text-sm" style={{ color: "var(--muted-foreground)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Anterior</span>
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>
                {formatMonthLabel(selectedMonth)}
              </p>
              <div className="flex gap-2 justify-center mt-0.5">
                {monthIncome > 0 && (
                  <span className="text-[10px] mono-data" style={{ color: "var(--income)" }}>+{BRL(monthIncome)}</span>
                )}
                {monthExpense > 0 && (
                  <span className="text-[10px] mono-data" style={{ color: "var(--expense)" }}>-{BRL(monthExpense)}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedMonthIdx(i => Math.max(i - 1, 0))}
              disabled={selectedMonthIdx === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-transform active:scale-95 disabled:opacity-30"
              style={{ background: "var(--input)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Próximo</span>
              <i className="fa-solid fa-chevron-right text-sm" style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>
        )}

        {/* tx_type filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === opt.key ? "var(--primary)" : "var(--card)",
                color:      filter === opt.key ? "#fff" : "var(--muted-foreground)",
                border:     `1px solid ${filter === opt.key ? "transparent" : "var(--border)"}`,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Transactions for selected month */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <i className="fa-solid fa-inbox text-3xl" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {availableMonths.length === 0 ? "Nenhuma transação" : "Nenhuma transação encontrada"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filter !== "all" && (
              <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                {filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}
                {search && ` com "${search}"`}
              </p>
            )}
            {filtered.map(tx => {
              const cat = CATEGORIES.find(c => c.id === tx.categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
              const txInfo = TX_TYPE_LABELS[tx.txType] ?? TX_TYPE_LABELS["unknown"];
              const isInternal = tx.txType === "transfer_internal";

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3"
                  style={{
                    background: "var(--card)",
                    border:     "1px solid var(--border)",
                    opacity:    isInternal ? 0.55 : 1,
                  }}
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${txInfo.color}18` }}>
                    <i className={`fa-solid ${txInfo.icon} text-sm`} style={{ color: txInfo.color }} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="text-[10px]" style={{ color: txInfo.color }}>· {txInfo.label}</span>
                      {tx.isRecurring && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(251,191,36,0.15)", color: "var(--gold)" }}>
                          recorrente
                        </span>
                      )}
                      {tx.installments > 1 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
                          {tx.installmentCurrent}/{tx.installments}x
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="mono-data text-sm font-semibold flex-shrink-0"
                    style={{ color: tx.type === "income" ? "var(--income)" : "var(--expense)" }}>
                    {tx.type === "income" ? "+" : "-"}{BRL(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
