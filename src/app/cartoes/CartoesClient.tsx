"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRL, MONTH_NAMES } from "@/lib/formatters";
import CardSettingsSheet from "./CardSettingsSheet";
import AddToCardModal from "./AddToCardModal";
import CreateCardModal from "./CreateCardModal";

interface CardData {
  name: string;
  type: string;
  brand: string;
  currentFatura: number;
  currentCreditos: number;
  currentPayments: number;
  nextFatura: number;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  color: string;
  interestRate: number;
}

interface FutureMonth {
  monthKey: string;
  total: number;
  byCard: { name: string; amount: number; color: string }[];
}

interface Props {
  cards: CardData[];
  month: number;
  year: number;
  openSettings: string | null;
  futureMonths: FutureMonth[];
}

const BRAND_LABEL: Record<string, string> = {
  visa: "VISA", mastercard: "MASTER", elo: "ELO",
  amex: "AMEX", hipercard: "HIPER",
};

function VisualCard({ card, month, year }: { card: CardData; month: number; year: number }) {
  const router              = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const isCredit   = card.type === "credit_card";
  const gradBg     = `linear-gradient(135deg, ${card.color}cc 0%, ${card.color} 100%)`;
  const netFatura  = Math.max(0, card.currentFatura - card.currentPayments);
  const utilPct    = card.creditLimit > 0 ? Math.min((netFatura / card.creditLimit) * 100, 100) : 0;
  const overLimit  = card.creditLimit > 0 && utilPct > 80;

  const today         = new Date();
  const dueDate       = card.dueDay > 0
    ? new Date(today.getFullYear(), today.getMonth(), card.dueDay)
    : null;
  if (dueDate && dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
  const daysLeft = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)
    : null;

  const monthParam = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <>
      <div
        className="relative mx-5 rounded-3xl overflow-hidden animate-fade-in-up"
        style={{ background: gradBg, minHeight: 176, boxShadow: `0 8px 32px ${card.color}40` }}
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at 80% 15%, #fff 0%, transparent 55%)" }}
        />

        {/* Settings gear */}
        <button
          onClick={e => { e.stopPropagation(); setShowSettings(true); }}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center z-20"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <i className="fa-solid fa-gear text-white text-sm" />
        </button>

        {/* Card body — tap to open detail */}
        <button
          className="w-full p-5 text-left"
          onClick={() => router.push(`/cartoes/${encodeURIComponent(card.name)}?m=${monthParam}`)}
        >
          {/* Header row */}
          <div className="flex items-start justify-between mb-5 pr-10">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                {isCredit ? "Crédito" : "Conta"}
              </p>
              <p className="text-white font-bold text-lg leading-tight">{card.name}</p>
            </div>
            <i
              className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"} text-white/30 text-2xl mt-1`}
            />
          </div>

          {/* Amount + due row */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] mb-0.5">
                Fatura {MONTH_NAMES[month - 1]}
              </p>
              <p className="text-white text-2xl font-bold mono-data">
                {BRL(netFatura)}
              </p>
            </div>
            <div className="text-right">
              {daysLeft !== null ? (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-0.5">
                    {daysLeft <= 5 && netFatura > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                    <p className={`text-[10px] ${daysLeft <= 5 && netFatura > 0 ? "text-red-300 font-semibold" : "text-white/60"}`}>
                      {daysLeft <= 0 ? "Vence hoje!" : daysLeft === 1 ? "Vence amanhã!" : `Vence em ${daysLeft}d`}
                    </p>
                  </div>
                  <p className="text-white text-sm font-semibold mono-data">dia {card.dueDay}</p>
                </div>
              ) : card.nextFatura > 0 ? (
                <div>
                  <p className="text-white/60 text-[10px] mb-0.5">Próxima fatura</p>
                  <p className="text-white text-sm font-semibold mono-data">{BRL(card.nextFatura)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Limit bar */}
          {card.creditLimit > 0 ? (
            <div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${utilPct}%`, background: overLimit ? "#ef4444" : "rgba(255,255,255,0.85)" }}
                />
              </div>
              <div className="flex justify-between">
                <p className="text-white/50 text-[10px] mono-data">{Math.round(utilPct)}% usado</p>
                <p className="text-white/50 text-[10px] mono-data">Limite {BRL(card.creditLimit)}</p>
              </div>
            </div>
          ) : (
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
          )}
        </button>

        {/* Bottom row: brand + quick-add */}
        <div className="absolute bottom-4 left-5 right-4 flex items-center justify-between z-10">
          {isCredit && card.brand ? (
            <span className="text-white/40 text-[10px] font-bold tracking-widest">
              {BRAND_LABEL[card.brand] ?? card.brand.toUpperCase()}
            </span>
          ) : <span />}
          <button
            onClick={e => { e.stopPropagation(); setShowAdd(true); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <i className="fa-solid fa-plus text-white text-sm" />
          </button>
        </div>
      </div>

      {showSettings && (
        <CardSettingsSheet
          accountName={card.name}
          accountType={card.type}
          existing={{
            account_name:  card.name,
            credit_limit:  card.creditLimit,
            due_day:       card.dueDay,
            closing_day:   card.closingDay,
            color:         card.color,
            account_type:  card.type,
            interest_rate: card.interestRate || undefined,
          }}
          onClose={() => setShowSettings(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {showAdd && (
        <AddToCardModal
          cardName={card.name}
          cardType={card.type}
          onClose={() => setShowAdd(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}

export default function CartoesClient({ cards, month, year, openSettings, futureMonths }: Props) {
  const router = useRouter();
  const [settingsCard, setSettingsCard] = useState<string | null>(openSettings);
  const [showCreate,   setShowCreate]   = useState(false);

  const creditCards = cards.filter(c => c.type === "credit_card");
  const checking    = cards.filter(c => c.type !== "credit_card");

  const totalFatura = creditCards.reduce((s, c) => s + Math.max(0, c.currentFatura - c.currentPayments), 0);
  const totalNext   = creditCards.reduce((s, c) => s + c.nextFatura, 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Botão criar cartão — sempre visível no topo */}
      <div className="mx-5">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: "rgba(244,114,182,0.08)",
            border: "1.5px dashed rgba(244,114,182,0.4)",
            color: "var(--primary)",
          }}
        >
          <i className="fa-solid fa-plus text-xs" />
          Criar novo cartão
        </button>
      </div>

      {cards.length === 0 ? (
        /* Empty state */
        <div className="mx-5">
          <div
            className="card-pingo flex flex-col items-center gap-4 py-14 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(244,114,182,0.1)" }}
            >
              <i className="fa-solid fa-credit-card text-3xl" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <p className="font-semibold">Nenhum cartão ainda</p>
              <p className="text-sm mt-1 max-w-[240px]" style={{ color: "var(--muted-foreground)" }}>
                Crie um cartão acima e depois importe a fatura ou adicione gastos manualmente
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Resumo de crédito */}
          {creditCards.length > 0 && (
            <div className="mx-5 grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Faturas {MONTH_NAMES[month - 1]}
                </p>
                <p className="mono-data text-base font-bold" style={{ color: "var(--expense)" }}>
                  {BRL(totalFatura)}
                </p>
              </div>
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Próximo mês
                </p>
                <p
                  className="mono-data text-base font-bold"
                  style={{ color: totalNext > totalFatura ? "var(--expense)" : "var(--muted-foreground)" }}
                >
                  {BRL(totalNext)}
                </p>
              </div>
            </div>
          )}

          {/* Calendário de compromissos futuros */}
          {futureMonths.length > 0 && (
            <div className="mx-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--muted-foreground)" }}>
                Compromisso futuro
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {(() => {
                  const peak = Math.max(...futureMonths.map(f => f.total));
                  return futureMonths.map(fm => {
                    const [yr, mo] = fm.monthKey.split("-");
                    const label = new Date(Number(yr), Number(mo) - 1, 1)
                      .toLocaleDateString("pt-BR", { month: "short" })
                      .replace(".", "");
                    const isPeak = fm.total === peak && peak > 0;
                    const barPct = peak > 0 ? Math.round((fm.total / peak) * 100) : 0;
                    return (
                      <div key={fm.monthKey}
                        className="flex-shrink-0 rounded-2xl px-3.5 pt-3 pb-3 flex flex-col gap-2"
                        style={{
                          minWidth: 100,
                          background: isPeak ? "rgba(239,68,68,0.07)" : "var(--card)",
                          border: isPeak ? "1px solid rgba(239,68,68,0.2)" : "1px solid var(--border)",
                        }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: isPeak ? "#ef4444" : "var(--muted-foreground)" }}>
                            {label} {yr}
                          </p>
                          {isPeak && <i className="fa-solid fa-arrow-trend-up text-[9px] text-red-400" />}
                        </div>
                        <p className="mono-data text-sm font-bold leading-none"
                          style={{ color: isPeak ? "#ef4444" : "var(--foreground)" }}>
                          {BRL(fm.total)}
                        </p>
                        {/* Barra proporcional */}
                        <div className="h-1 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${barPct}%`,
                              background: isPeak ? "#ef4444" : "var(--primary)",
                            }} />
                        </div>
                        {/* Pontos por cartão */}
                        <div className="flex gap-1 flex-wrap">
                          {fm.byCard.map(bc => (
                            <span key={bc.name}
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: bc.color }}
                              title={`${bc.name}: ${BRL(bc.amount)}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-[9px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                Cada ponto = um cartão · apenas despesas CC futuras importadas
              </p>
            </div>
          )}

          {/* Estratégia de pagamento — só exibe quando algum cartão tem taxa configurada */}
          {(() => {
            const withRate = creditCards
              .filter(c => c.interestRate > 0 && Math.max(0, c.currentFatura - c.currentPayments) > 0)
              .sort((a, b) => b.interestRate - a.interestRate);
            if (withRate.length === 0) return null;

            const totalDebt = withRate.reduce((s, c) => s + Math.max(0, c.currentFatura - c.currentPayments), 0);

            return (
              <div className="mx-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--muted-foreground)" }}>
                  Estratégia de pagamento
                </p>
                <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Método avalanche · pague primeiro o maior juros
                </p>
                <div className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {withRate.map((card, i) => {
                    const debt     = Math.max(0, card.currentFatura - card.currentPayments);
                    const monthly  = card.interestRate / 100;
                    const isFirst  = i === 0;
                    const interest = debt * monthly;
                    return (
                      <div key={card.name}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: i < withRate.length - 1 ? "1px solid var(--border)" : "none" }}>
                        {/* Rank */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{
                            background: isFirst ? "rgba(239,68,68,0.12)" : "var(--input)",
                            color:      isFirst ? "#ef4444" : "var(--muted-foreground)",
                          }}>
                          {i + 1}º
                        </div>
                        {/* Cor do cartão */}
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: card.color }} />
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{card.name}</p>
                          <p className="text-[10px] mono-data" style={{ color: "var(--muted-foreground)" }}>
                            {card.interestRate.toFixed(1)}%/mês
                            · juros ~{BRL(interest)}/mês se não pagar
                          </p>
                        </div>
                        {/* Dívida */}
                        <div className="text-right flex-shrink-0">
                          <p className="mono-data text-sm font-semibold" style={{ color: "var(--expense)" }}>
                            {BRL(debt)}
                          </p>
                          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                            {totalDebt > 0 ? Math.round((debt / totalDebt) * 100) : 0}% do total
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Rodapé total */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: "rgba(239,68,68,0.05)", borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                      Total dívida CC
                    </p>
                    <p className="mono-data text-sm font-bold" style={{ color: "var(--expense)" }}>
                      {BRL(totalDebt)}
                    </p>
                  </div>
                </div>
                <p className="text-[9px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                  Configure a taxa no ⚙ de cada cartão · baseado na fatura atual
                </p>
              </div>
            );
          })()}

          {/* Cartões de crédito */}
          {creditCards.length > 0 && (
            <div className="flex flex-col gap-4">
              {creditCards.length > 1 && (
                <p
                  className="text-xs font-semibold uppercase tracking-wider px-5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Cartões de crédito
                </p>
              )}
              {creditCards.map(card => (
                <VisualCard key={card.name} card={card} month={month} year={year} />
              ))}
            </div>
          )}

          {/* Contas correntes */}
          {checking.length > 0 && (
            <div className="flex flex-col gap-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider px-5 mt-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                Contas correntes
              </p>
              {checking.map(card => (
                <VisualCard key={card.name} card={card} month={month} year={year} />
              ))}
            </div>
          )}

          <p
            className="text-[10px] text-center pb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Toque no cartão para ver detalhes · ⚙ para configurar · + para adicionar
          </p>
        </>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateCardModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); router.refresh(); }}
        />
      )}

      {settingsCard && (
        <CardSettingsSheet
          accountName={settingsCard}
          accountType={cards.find(c => c.name === settingsCard)?.type}
          onClose={() => setSettingsCard(null)}
          onSaved={() => { setSettingsCard(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
