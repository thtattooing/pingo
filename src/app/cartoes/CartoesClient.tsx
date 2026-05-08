"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import MonthNav from "@/components/MonthNav";

interface Tx {
  id: string;
  description: string;
  amount: number;
  type: string;
  category_id?: string | null;
  date: string;
  account_name?: string | null;
  account_type?: string | null;
  subcategory?: string | null;
  is_recurring?: boolean | null;
}

interface Props {
  creditCards: { name: string; transactions: Tx[] }[];
  checking:    { name: string; transactions: Tx[] }[];
  month: number;
  year: number;
  schemaReady: boolean;
}

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function TxRow({ tx }: { tx: Tx }) {
  const cat = CATEGORIES.find(c => c.id === (tx.category_id ?? "outros")) ?? CATEGORIES[CATEGORIES.length - 1];
  const isIncome = tx.type === "income";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${cat.color}20` }}>
        <i className={`fa-solid ${cat.icon} text-xs`} style={{ color: cat.color }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{tx.description}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {tx.subcategory ?? cat.name} · {formatDate(tx.date)}
          {tx.is_recurring && (
            <span className="ml-1 px-1 py-0 rounded text-[8px]"
              style={{ background: "rgba(251,191,36,0.15)", color: "var(--gold)" }}>recorrente</span>
          )}
        </p>
      </div>
      <span className="mono-data text-xs font-semibold flex-shrink-0"
        style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}>
        {isIncome ? "+" : "-"}{BRL(tx.amount)}
      </span>
    </div>
  );
}

function CardSection({
  name,
  transactions,
  isCredit,
}: {
  name: string;
  transactions: Tx[];
  isCredit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total   = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const income  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const balance = income - total;

  const accent  = isCredit ? "var(--primary)" : "#8B5CF6";
  const icon    = isCredit ? "fa-credit-card" : "fa-building-columns";
  const gradBg  = isCredit
    ? "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)"
    : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

  return (
    <div className="card-pingo flex flex-col gap-0 overflow-hidden p-0">
      {/* Card header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 p-4 w-full text-left active:opacity-70"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradBg }}>
          <i className={`fa-solid ${icon} text-white text-sm`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-1">
          {isCredit ? (
            <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>
              {BRL(total)}
            </p>
          ) : (
            <p className="mono-data text-sm font-semibold"
              style={{ color: balance >= 0 ? "var(--income)" : "var(--expense)" }}>
              {balance >= 0 ? "+" : ""}{BRL(balance)}
            </p>
          )}
          <p className="text-[9px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {isCredit ? "fatura" : "saldo"}
          </p>
        </div>
        <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"} text-xs flex-shrink-0`}
          style={{ color: accent }} />
      </button>

      {/* Bill total bar (credit cards only) */}
      {isCredit && (
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ background: gradBg, width: "100%" }} />
          </div>
          <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "var(--expense)" }}>
            Fatura: {BRL(total)}
          </span>
        </div>
      )}

      {/* Transactions (expandable) */}
      {open && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-2">
            {transactions.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma transação neste mês
              </p>
            ) : (
              transactions.map(tx => <TxRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartoesClient({ creditCards, checking, month, year, schemaReady }: Props) {
  const totalFatura = creditCards.reduce((s, card) =>
    s + card.transactions.filter(t => t.type === "expense").reduce((ss, t) => ss + t.amount, 0), 0);

  if (!schemaReady) {
    return (
      <div className="flex flex-col gap-4">
        <MonthNav month={month} year={year} basePath="/cartoes" />
        <div className="card-pingo flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.1)" }}>
            <i className="fa-solid fa-database text-2xl" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm">Atualização necessária</p>
            <p className="text-xs mt-1 max-w-[260px]" style={{ color: "var(--muted-foreground)" }}>
              Execute o arquivo <span className="mono-data font-semibold" style={{ color: "var(--foreground)" }}>supabase-schema-v2.sql</span> no SQL Editor do Supabase para ativar a separação por cartão.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (creditCards.length === 0 && checking.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <MonthNav month={month} year={year} basePath="/cartoes" />
        <div className="card-pingo flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(244,114,182,0.1)" }}>
            <i className="fa-solid fa-credit-card text-2xl" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm">Nenhuma conta neste mês</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Importe um extrato para ver as faturas aqui.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MonthNav month={month} year={year} basePath="/cartoes" />

      {/* Credit cards section */}
      {creditCards.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}>
              Cartões de crédito
            </p>
            {creditCards.length > 1 && (
              <p className="mono-data text-xs font-semibold" style={{ color: "var(--expense)" }}>
                Total: {BRL(totalFatura)}
              </p>
            )}
          </div>
          {creditCards.map(card => (
            <CardSection key={card.name} name={card.name} transactions={card.transactions} isCredit />
          ))}
        </>
      )}

      {/* Checking accounts section */}
      {checking.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-2"
            style={{ color: "var(--muted-foreground)" }}>
            Contas correntes
          </p>
          {checking.map(acc => (
            <CardSection key={acc.name} name={acc.name} transactions={acc.transactions} isCredit={false} />
          ))}
        </>
      )}

      <p className="text-[10px] text-center pb-2" style={{ color: "var(--muted-foreground)" }}>
        Toque em um cartão para ver as transações
      </p>
    </div>
  );
}
