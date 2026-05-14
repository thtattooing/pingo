"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRL } from "@/lib/formatters";
import TransferModal from "./TransferModal";

interface AccountData {
  name: string;
  type: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  initialBalance: number;
  color: string;
  icon: string;
  txCount: number;
  lastDate: string | null;
}

interface CardAccount {
  name: string;
  color: string;
  type: string;
}

function AccountCard({ account }: { account: AccountData }) {
  const router = useRouter();
  const isPositive = account.balance >= 0;
  const grad = `linear-gradient(135deg, ${account.color}bb 0%, ${account.color} 100%)`;

  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ background: grad, minHeight: 150, boxShadow: `0 8px 32px ${account.color}40` }}
      onClick={() => router.push(`/contas/${encodeURIComponent(account.name)}`)}
    >
      <div className="absolute inset-0 opacity-15"
        style={{ background: "radial-gradient(ellipse at 80% 20%, #fff 0%, transparent 60%)" }} />

      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              {account.type === "savings" ? "Poupança" : "Conta Corrente"}
            </p>
            <p className="text-white font-bold text-base leading-tight">{account.name}</p>
          </div>
          <i className={`fa-solid ${account.icon} text-white/40 text-2xl`} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-[10px] mb-0.5">Saldo atual</p>
            <p className="text-white text-2xl font-bold mono-data">
              {BRL(account.balance)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] text-white/60">
                <i className="fa-solid fa-arrow-up text-[8px] mr-0.5" />
                {BRL(account.totalIncome)}
              </span>
              <span className="text-[10px] text-white/60">
                <i className="fa-solid fa-arrow-down text-[8px] mr-0.5" />
                {BRL(account.totalExpense)}
              </span>
            </div>
            <p className="text-white/50 text-[10px] mt-0.5 text-right">
              {account.txCount} transações
            </p>
          </div>
        </div>
      </div>

      {!isPositive && (
        <div className="absolute top-3 left-3">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(239,68,68,0.4)", color: "#fff" }}>
            Saldo negativo
          </span>
        </div>
      )}
    </div>
  );
}

export default function ContasClient({
  accounts,
  cardAccounts,
  totalCommitted,
  totalInvestments,
  totalSavings,
  creditCardDebt,
}: {
  accounts: AccountData[];
  cardAccounts: CardAccount[];
  totalCommitted: number;
  totalInvestments: number;
  totalSavings: number;
  creditCardDebt: number;
}) {
  const router = useRouter();
  const [showTransfer, setShowTransfer] = useState(false);

  const allAccounts = [
    ...accounts.map(a => ({ name: a.name, color: a.color, type: a.type })),
    ...cardAccounts,
  ];
  const canTransfer = accounts.length >= 1 && allAccounts.length >= 2;

  if (accounts.length === 0) {
    return (
      <div className="card-pingo flex flex-col items-center gap-4 py-14 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.1)" }}>
          <i className="fa-solid fa-building-columns text-3xl" style={{ color: "#8B5CF6" }} />
        </div>
        <div>
          <p className="font-semibold">Nenhuma conta ainda</p>
          <p className="text-sm mt-1 max-w-[240px]" style={{ color: "var(--muted-foreground)" }}>
            Importe um extrato de conta corrente para começar
          </p>
        </div>
        <button
          onClick={() => router.push("/importar")}
          className="btn-primary py-3 px-6 text-sm font-semibold rounded-2xl">
          <i className="fa-solid fa-file-arrow-up mr-2" />
          Importar extrato
        </button>
      </div>
    );
  }

  const totalBalance     = accounts.reduce((s, a) => s + a.balance, 0);
  const projectedBalance = totalBalance - totalCommitted;
  const totalAssets      = totalBalance + totalInvestments + totalSavings;
  const netWorth         = totalAssets - creditCardDebt;

  return (
    <div className="flex flex-col gap-5">
      {/* Patrimônio Líquido */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
          Patrimônio Líquido
        </p>
        <p className="mono-data text-2xl font-bold mb-3"
          style={{ color: netWorth >= 0 ? "#6366F1" : "var(--expense)" }}>
          {BRL(netWorth)}
        </p>
        <div className="flex flex-col gap-1.5" style={{ borderTop: "1px solid rgba(99,102,241,0.15)", paddingTop: "0.75rem" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              <i className="fa-solid fa-building-columns mr-1.5 text-[10px]" style={{ color: "#8B5CF6" }} />
              Contas
            </p>
            <p className="mono-data text-[11px] font-semibold" style={{ color: "var(--income)" }}>{BRL(totalBalance)}</p>
          </div>
          {totalInvestments > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <i className="fa-solid fa-chart-line mr-1.5 text-[10px]" style={{ color: "#6366F1" }} />
                Investimentos
              </p>
              <p className="mono-data text-[11px] font-semibold" style={{ color: "var(--income)" }}>{BRL(totalInvestments)}</p>
            </div>
          )}
          {totalSavings > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <i className="fa-solid fa-piggy-bank mr-1.5 text-[10px]" style={{ color: "#10B981" }} />
                Reservas/Metas
              </p>
              <p className="mono-data text-[11px] font-semibold" style={{ color: "var(--income)" }}>{BRL(totalSavings)}</p>
            </div>
          )}
          {creditCardDebt > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <i className="fa-solid fa-credit-card mr-1.5 text-[10px]" style={{ color: "var(--expense)" }} />
                Dívida cartões
              </p>
              <p className="mono-data text-[11px] font-semibold" style={{ color: "var(--expense)" }}>-{BRL(creditCardDebt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Total summary */}
      <div className="rounded-2xl px-4 py-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
          Saldo total das contas
        </p>
        <p className="mono-data text-2xl font-bold"
          style={{ color: totalBalance >= 0 ? "var(--income)" : "var(--expense)" }}>
          {BRL(totalBalance)}
        </p>

        {totalCommitted > 0 && (
          <div className="mt-2 pt-2 flex flex-col gap-1"
            style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <i className="fa-solid fa-credit-card mr-1.5 text-[10px]" style={{ color: "var(--expense)" }} />
                Comprometido em faturas
              </p>
              <p className="mono-data text-[11px] font-semibold" style={{ color: "var(--expense)" }}>
                -{BRL(totalCommitted)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Disponível projetado
              </p>
              <p className="mono-data text-[11px] font-semibold"
                style={{ color: projectedBalance >= 0 ? "var(--income)" : "var(--expense)" }}>
                {BRL(projectedBalance)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transfer button */}
      {canTransfer && (
        <button
          onClick={() => setShowTransfer(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            background: "rgba(99,102,241,0.1)",
            color: "#6366F1",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <i className="fa-solid fa-right-left text-sm" />
          Transferir entre contas
        </button>
      )}

      {/* Account cards */}
      <div className="flex flex-col gap-4">
        {accounts.map(acc => (
          <AccountCard key={acc.name} account={acc} />
        ))}
      </div>

      <p className="text-[10px] text-center pb-2" style={{ color: "var(--muted-foreground)" }}>
        Toque na conta para ver o extrato completo
      </p>

      {showTransfer && (
        <TransferModal
          accounts={allAccounts}
          onClose={() => setShowTransfer(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
