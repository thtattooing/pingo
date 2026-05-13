"use client";

import { useState, useMemo, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import { BRL, formatDate, MONTH_NAMES } from "@/lib/formatters";
import AddToCardModal from "@/app/cartoes/AddToCardModal";
import EditTransactionModal from "@/components/EditTransactionModal";
import type { Transaction } from "@/components/TransactionList";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface CardTx {
  id: string;
  description: string;
  amount: number;
  type: string;
  category_id: string | null;
  date: string;
  installments: number | null;
  installment_current: number | null;
  installment_group_id: string | null;
  is_recurring: boolean | null;
  subcategory: string | null;
}

interface CardSettings {
  credit_limit: number;
  due_day: number;
  closing_day: number;
  color: string;
}

interface InstallmentSeries {
  groupId: string;
  description: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  monthlyAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  nextDate: string | null;
}

interface FutureMonth {
  key: string;
  label: string;
  committed: number;
}

interface Props {
  cardName: string;
  cardType: string;
  settings: CardSettings | null;
  // All transactions for this card (past + future)
  allTransactions: CardTx[];
  futureFaturas: FutureMonth[];
  installmentSeries: InstallmentSeries[];
  month: number;
  year: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function TxRow({ tx, onClick }: { tx: CardTx; onClick?: () => void }) {
  const cat = CATEGORIES.find(c => c.id === (tx.category_id ?? "outros")) ?? CATEGORIES[CATEGORIES.length - 1];
  const isIncome = tx.type === "income";
  const hasInstallments = tx.installments && tx.installments > 1;
  return (
    <button onClick={onClick} className="flex items-center gap-3 py-3 border-b last:border-b-0 w-full text-left"
      style={{ borderColor: "var(--border)" }}>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
        <i className={`fa-solid ${cat.icon} text-xs`} style={{ color: cat.color }} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-medium truncate max-w-[160px]">{tx.description}</p>
          {hasInstallments && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.15)", color: "#A78BFA" }}>
              {tx.installment_current}/{tx.installments}x
            </span>
          )}
          {tx.is_recurring && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full mono-data flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.15)", color: "var(--gold)" }}>
              recorrente
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {tx.subcategory ?? cat.name} · {formatDate(tx.date)}
        </p>
      </div>
      <span className="mono-data text-sm font-medium flex-shrink-0"
        style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}>
        {isIncome ? "+" : "-"}{BRL(tx.amount)}
      </span>
    </button>
  );
}

// ── PagarFaturaModal ───────────────────────────────────────────────────────

function PagarFaturaModal({
  cardName, fatura, color, selMonth, selYear, onClose, onPaid,
}: {
  cardName: string; fatura: number; color: string;
  selMonth: number; selYear: number;
  onClose: () => void; onPaid: () => void;
}) {
  const [accounts, setAccounts]     = useState<string[]>([]);
  const [fromAccount, setFromAccount] = useState("");
  const [amount, setAmount]         = useState(fatura.toFixed(2));
  const [date, setDate]             = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("transactions" as any)
      .select("account_name")
      .eq("account_type", "checking")
      .not("account_name", "is", null)
      .then(({ data }: { data: { account_name: string }[] | null }) => {
        const names = [...new Set((data ?? []).map(t => t.account_name))].filter(Boolean);
        setAccounts(names);
        if (names.length > 0) setFromAccount(names[0]);
      });
  }, []);

  async function handlePagar() {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!fromAccount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessão expirada."); setSaving(false); return; }

    const { error: err } = await supabase.from("transactions").insert({
      user_id:      user.id,
      description:  `Pagamento fatura ${cardName}`,
      amount:       parsedAmount,
      type:         "expense",
      category_id:  "moradia", // generic category for bill payment
      tx_type:      "transfer_internal",
      account_type: "checking",
      account_name: fromAccount,
      date,
      is_imported:  false,
      is_recurring: false,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onPaid();
  }

  const monthLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 flex flex-col gap-5 animate-fade-in-up"
        style={{ background: "var(--background)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Pagar fatura</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {cardName} · {monthLabel}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--input)" }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        {/* Fatura amount */}
        <div className="rounded-2xl px-4 py-3 text-center"
          style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Valor da fatura</p>
          <p className="text-2xl font-bold mono-data" style={{ color }}>{BRL(fatura)}</p>
        </div>

        {/* Amount to pay (editable for partial) */}
        <div>
          <p className="text-xs mb-1.5 font-medium">Valor a pagar</p>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mono-data"
            style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Pode editar para pagamento parcial
          </p>
        </div>

        {/* From account */}
        <div>
          <p className="text-xs mb-1.5 font-medium">Debitar de qual conta</p>
          {accounts.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Nenhuma conta corrente encontrada. Importe um extrato de conta corrente primeiro.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {accounts.map(acc => (
                <button key={acc} onClick={() => setFromAccount(acc)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{
                    background: fromAccount === acc ? "rgba(139,92,246,0.1)" : "var(--muted)",
                    border: `1.5px solid ${fromAccount === acc ? "#8B5CF6" : "transparent"}`,
                  }}>
                  <i className="fa-solid fa-building-columns text-xs" style={{ color: "#8B5CF6" }} />
                  <span className="text-sm font-medium flex-1">{acc}</span>
                  {fromAccount === acc && <i className="fa-solid fa-check text-xs" style={{ color: "#8B5CF6" }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <p className="text-xs mb-1.5 font-medium">Data do pagamento</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "var(--expense)" }}>
            {error}
          </p>
        )}

        <button onClick={handlePagar} disabled={saving || !fromAccount || accounts.length === 0}
          className="w-full py-4 rounded-2xl font-semibold text-sm disabled:opacity-40"
          style={{ background: color, color: "#fff" }}>
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Registrando…</>
            : <><i className="fa-solid fa-check mr-2" />Confirmar pagamento</>}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function CardDetailClient({
  cardName, cardType, settings, allTransactions, futureFaturas, installmentSeries, month, year,
}: Props) {
  const [tab, setTab]           = useState<"fatura" | "parcelas" | "futuro">("fatura");
  const [showAdd, setShowAdd]   = useState(false);
  const [showPagar, setShowPagar] = useState(false);
  const [editTx, setEditTx]     = useState<Transaction | null>(null);
  const [selMonth, setSelMonth] = useState(month);
  const [selYear, setSelYear]   = useState(year);

  const color      = settings?.color ?? (cardType === "credit_card" ? "#F472B6" : "#8B5CF6");
  const isCredit   = cardType === "credit_card";
  const gradBg     = `linear-gradient(135deg, ${color}cc, ${color})`;

  // Transactions for selected month
  const monthTx = useMemo(() => allTransactions.filter(t => {
    const d = new Date(t.date + "T12:00:00");
    return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
  }), [allTransactions, selMonth, selYear]);

  const fatura   = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const creditos = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const utilPct  = settings?.credit_limit ? Math.min((fatura / settings.credit_limit) * 100, 100) : 0;

  function prevMonth() {
    if (selMonth === 1) { setSelMonth(12); setSelYear(y => y - 1); }
    else setSelMonth(m => m - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (selYear > now.getFullYear() || (selYear === now.getFullYear() && selMonth >= now.getMonth() + 1)) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear(y => y + 1); }
    else setSelMonth(m => m + 1);
  }

  const maxFuture = Math.max(...futureFaturas.map(f => f.committed), 1);

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* Card visual */}
      <div className="mx-5 mb-5 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: gradBg, minHeight: 140 }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(circle at 70% 30%, #fff 0%, transparent 60%)" }} />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
              {isCredit ? "Cartão de Crédito" : "Conta Corrente"}
            </p>
            <p className="text-white text-lg font-semibold mt-0.5">{cardName}</p>
          </div>
          <i className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"} text-white/60 text-xl`} />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs mb-0.5">Fatura {MONTH_NAMES[selMonth - 1]}</p>
            <p className="text-white text-2xl font-bold mono-data">{BRL(fatura)}</p>
          </div>
          {settings?.due_day && (
            <div className="text-right">
              <p className="text-white/60 text-xs">Vence dia</p>
              <p className="text-white text-lg font-bold mono-data">{settings.due_day}</p>
            </div>
          )}
        </div>
        {settings?.credit_limit ? (
          <div className="mt-3">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full" style={{ width: `${utilPct}%`, background: "rgba(255,255,255,0.8)" }} />
            </div>
            <p className="text-white/50 text-[10px] mt-1 mono-data">
              {Math.round(utilPct)}% de {BRL(settings.credit_limit)} usado
            </p>
          </div>
        ) : null}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between px-5 mb-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-chevron-left text-xs" />
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[selMonth - 1]} {selYear}
        </span>
        <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-chevron-right text-xs" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 mb-4">
        {([
          { id: "fatura",   label: "Fatura",   icon: "fa-receipt" },
          { id: "parcelas", label: "Parcelas", icon: "fa-rotate" },
          { id: "futuro",   label: "Futuro",   icon: "fa-calendar-days" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? color : "var(--card)",
              color:      tab === t.id ? "#fff" : "var(--muted-foreground)",
              border:     tab === t.id ? "none" : "1px solid var(--border)",
            }}>
            <i className={`fa-solid ${t.icon} text-xs`} />
            {t.label}
            {t.id === "parcelas" && installmentSeries.length > 0 && (
              <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: tab === "parcelas" ? "rgba(255,255,255,0.25)" : color, color: tab === "parcelas" ? "#fff" : "#fff" }}>
                {installmentSeries.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: FATURA ── */}
      {tab === "fatura" && (
        <div className="px-5 flex flex-col gap-3">
          {/* Summary row */}
          {creditos > 0 && (
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Compras</p>
                <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>{BRL(fatura)}</p>
              </div>
              <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Pagamentos</p>
                <p className="mono-data text-sm font-semibold" style={{ color: "var(--income)" }}>{BRL(creditos)}</p>
              </div>
            </div>
          )}

          {monthTx.length === 0 ? (
            <div className="card-pingo flex flex-col items-center gap-3 py-10 text-center">
              <i className="fa-solid fa-receipt text-3xl" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Sem transações neste mês</p>
            </div>
          ) : (
            <div className="card-pingo flex flex-col gap-0">
              {monthTx.map(tx => (
                <TxRow key={tx.id} tx={tx} onClick={() => setEditTx({
                  id: tx.id, description: tx.description, amount: tx.amount,
                  type: tx.type as "income" | "expense", category: tx.category_id ?? "outros",
                  date: tx.date, installments: tx.installments ?? undefined,
                  installmentCurrent: tx.installment_current ?? undefined,
                })} />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: gradBg, color: "#fff" }}>
              <i className="fa-solid fa-plus text-xs" />
              Adicionar
            </button>
            {fatura > 0 && (
              <button onClick={() => setShowPagar(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--card)", color: "var(--foreground)", border: `1.5px solid ${color}60` }}>
                <i className="fa-solid fa-money-bill-wave text-xs" style={{ color }} />
                Pagar fatura
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PARCELAS ── */}
      {tab === "parcelas" && (
        <div className="px-5 flex flex-col gap-3">
          {installmentSeries.length === 0 ? (
            <div className="card-pingo flex flex-col items-center gap-3 py-10 text-center">
              <i className="fa-solid fa-rotate text-3xl" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma compra parcelada ativa</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Adicione uma compra em parcelas para acompanhar aqui
              </p>
            </div>
          ) : (
            <>
              <div className="card-pingo flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Total ainda a pagar</p>
                  <p className="text-lg font-semibold mono-data" style={{ color: "var(--expense)" }}>
                    {BRL(installmentSeries.reduce((s, x) => s + x.remainingAmount, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{installmentSeries.length} série{installmentSeries.length !== 1 ? "s" : ""} ativa{installmentSeries.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {installmentSeries.map(s => {
                const pct = Math.round((s.paidInstallments / s.totalInstallments) * 100);
                return (
                  <div key={s.groupId} className="card-pingo flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold flex-1 leading-tight">{s.description}</p>
                      <span className="text-xs mono-data flex-shrink-0 font-semibold" style={{ color }}>
                        {s.paidInstallments}/{s.totalInstallments}x
                      </span>
                    </div>

                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: gradBg }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs mono-data font-semibold" style={{ color: "var(--expense)" }}>
                          {BRL(s.remainingAmount)} restando
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {s.remainingInstallments} parcela{s.remainingInstallments !== 1 ? "s" : ""} de {BRL(s.monthlyAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs mono-data" style={{ color: "var(--income)" }}>
                          {BRL(s.paidAmount)} pago
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{pct}% quitado</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── TAB: FUTURO ── */}
      {tab === "futuro" && (
        <div className="px-5 flex flex-col gap-3">
          {futureFaturas.length === 0 ? (
            <div className="card-pingo flex flex-col items-center gap-3 py-10 text-center">
              <i className="fa-solid fa-calendar-days text-3xl" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Sem compromissos futuros</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Parcelas futuras aparecerão aqui automaticamente
              </p>
            </div>
          ) : (
            <>
              <div className="card-pingo">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted-foreground)" }}>
                  Compromissos das próximas faturas
                </h3>
                <div className="flex flex-col gap-3">
                  {futureFaturas.map(f => {
                    const barPct = settings?.credit_limit
                      ? Math.min((f.committed / settings.credit_limit) * 100, 100)
                      : (f.committed / maxFuture) * 100;
                    const overLimit = settings?.credit_limit && f.committed > settings.credit_limit * 0.8;
                    return (
                      <div key={f.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{f.label}</span>
                          <span className="text-xs mono-data font-semibold"
                            style={{ color: overLimit ? "var(--expense)" : "var(--foreground)" }}>
                            {BRL(f.committed)}
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden relative" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${barPct}%`, background: overLimit ? "var(--expense)" : gradBg }} />
                        </div>
                        {settings?.credit_limit && (
                          <p className="text-[10px] mt-0.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
                            {Math.round(barPct)}% do limite
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-pingo flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}>
                  <i className="fa-solid fa-lightbulb text-sm" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium">Total comprometido</p>
                  <p className="text-sm font-bold mono-data" style={{ color }}>
                    {BRL(futureFaturas.reduce((s, f) => s + f.committed, 0))}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    em {futureFaturas.length} faturas futuras
                  </p>
                </div>
              </div>
            </>
          )}

          <button onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: gradBg, color: "#fff" }}>
            <i className="fa-solid fa-plus" />
            Adicionar compra parcelada
          </button>
        </div>
      )}

      {showAdd && (
        <AddToCardModal
          cardName={cardName}
          cardType={cardType}
          onClose={() => setShowAdd(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          onClose={() => setEditTx(null)}
          onSaved={() => window.location.reload()}
        />
      )}

      {showPagar && (
        <PagarFaturaModal
          cardName={cardName}
          fatura={fatura}
          color={color}
          selMonth={selMonth}
          selYear={selYear}
          onClose={() => setShowPagar(false)}
          onPaid={() => { setShowPagar(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}
