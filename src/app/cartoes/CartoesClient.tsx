"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRL, MONTH_NAMES } from "@/lib/formatters";
import CardSettingsSheet from "./CardSettingsSheet";
import AddToCardModal from "./AddToCardModal";

interface CardData {
  name: string;
  type: string;
  currentFatura: number;
  currentCreditos: number;
  nextFatura: number;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  color: string;
}

interface Props {
  cards: CardData[];
  month: number;
  year: number;
  openSettings: string | null;
}

function VisualCard({ card, month }: { card: CardData; month: number }) {
  const router            = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const isCredit  = card.type === "credit_card";
  const gradBg    = `linear-gradient(135deg, ${card.color}bb 0%, ${card.color} 100%)`;
  const utilPct   = card.creditLimit > 0 ? Math.min((card.currentFatura / card.creditLimit) * 100, 100) : 0;
  const overLimit = card.creditLimit > 0 && utilPct > 80;

  // Days until due
  const today    = new Date();
  const dueThisMonth = card.dueDay > 0
    ? new Date(today.getFullYear(), today.getMonth(), card.dueDay)
    : null;
  if (dueThisMonth && dueThisMonth < today) dueThisMonth?.setMonth(dueThisMonth.getMonth() + 1);
  const daysLeft = dueThisMonth
    ? Math.ceil((dueThisMonth.getTime() - today.getTime()) / 86400000)
    : null;

  return (
    <>
      <div className="relative mx-5 rounded-3xl overflow-hidden animate-fade-in-up"
        style={{ background: gradBg, minHeight: 170, boxShadow: `0 8px 32px ${card.color}40` }}>
        {/* Background glow */}
        <div className="absolute inset-0 opacity-15"
          style={{ background: "radial-gradient(ellipse at 80% 20%, #fff 0%, transparent 60%)" }} />

        {/* Settings gear */}
        <button
          onClick={e => { e.stopPropagation(); setShowSettings(true); }}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center z-10"
          style={{ background: "rgba(255,255,255,0.15)" }}>
          <i className="fa-solid fa-gear text-white text-xs" />
        </button>

        {/* Card content (tap to open detail) */}
        <button className="w-full p-5 text-left active:opacity-80"
          onClick={() => router.push(`/cartoes/${encodeURIComponent(card.name)}?m=${year}-${String(month).padStart(2,"0")}`)}>

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                {isCredit ? "Crédito" : "Conta"}
              </p>
              <p className="text-white font-bold text-base leading-tight">{card.name}</p>
            </div>
            <i className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"} text-white/40 text-2xl`} />
          </div>

          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] mb-0.5">Fatura {MONTH_NAMES[month - 1]}</p>
              <p className="text-white text-2xl font-bold mono-data">{BRL(card.currentFatura)}</p>
            </div>
            <div className="text-right">
              {daysLeft !== null ? (
                <div>
                  <p className="text-white/60 text-[10px] mb-0.5">
                    {daysLeft <= 0 ? "Venceu hoje" : `Vence em ${daysLeft}d`}
                  </p>
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

          {/* Utilization bar */}
          {card.creditLimit > 0 ? (
            <div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${utilPct}%`, background: overLimit ? "#ef4444" : "rgba(255,255,255,0.8)" }} />
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

        {/* Quick add button */}
        <button
          onClick={e => { e.stopPropagation(); setShowAdd(true); }}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center z-10"
          style={{ background: "rgba(255,255,255,0.2)" }}>
          <i className="fa-solid fa-plus text-white text-xs" />
        </button>
      </div>

      {showSettings && (
        <CardSettingsSheet
          accountName={card.name}
          existing={{ account_name: card.name, credit_limit: card.creditLimit, due_day: card.dueDay, color: card.color, closing_day: card.closingDay }}
          onClose={() => setShowSettings(false)}
          onSaved={() => window.location.reload()}
        />
      )}

      {showAdd && (
        <AddToCardModal
          cardName={card.name}
          cardType={card.type}
          onClose={() => setShowAdd(false)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  );
}

// Dummy year variable for router push — need to pass from props
let year = new Date().getFullYear();

export default function CartoesClient({ cards, month, year: y, openSettings }: Props) {
  year = y;
  const [settingsCard, setSettingsCard] = useState<string | null>(openSettings);

  // Total fatura all credit cards
  const totalFatura = cards.filter(c => c.type === "credit_card").reduce((s, c) => s + c.currentFatura, 0);
  const totalNext   = cards.filter(c => c.type === "credit_card").reduce((s, c) => s + c.nextFatura, 0);

  const creditCards = cards.filter(c => c.type === "credit_card");
  const checking    = cards.filter(c => c.type !== "credit_card");

  if (cards.length === 0) {
    return (
      <div className="px-5">
        <div className="card-pingo flex flex-col items-center gap-4 py-14 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(244,114,182,0.1)" }}>
            <i className="fa-solid fa-credit-card text-3xl" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="font-semibold">Nenhum cartão ainda</p>
            <p className="text-sm mt-1 max-w-[240px]" style={{ color: "var(--muted-foreground)" }}>
              Importe um extrato de cartão de crédito para começar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary banner */}
      {creditCards.length > 0 && (
        <div className="mx-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
              Total faturas {MONTH_NAMES[month - 1]}
            </p>
            <p className="mono-data text-base font-bold" style={{ color: "var(--expense)" }}>{BRL(totalFatura)}</p>
          </div>
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Próximo mês</p>
            <p className="mono-data text-base font-bold" style={{ color: totalNext > totalFatura ? "var(--expense)" : "var(--muted-foreground)" }}>
              {BRL(totalNext)}
            </p>
          </div>
        </div>
      )}

      {/* Credit cards */}
      {creditCards.length > 0 && (
        <div className="flex flex-col gap-4">
          {creditCards.length > 1 && (
            <p className="text-xs font-semibold uppercase tracking-wider px-5" style={{ color: "var(--muted-foreground)" }}>
              Cartões de crédito
            </p>
          )}
          {creditCards.map(card => (
            <VisualCard key={card.name} card={card} month={month} />
          ))}
        </div>
      )}

      {/* Checking accounts */}
      {checking.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider px-5 mt-2" style={{ color: "var(--muted-foreground)" }}>
            Contas correntes
          </p>
          {checking.map(card => (
            <VisualCard key={card.name} card={card} month={month} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-center pb-2" style={{ color: "var(--muted-foreground)" }}>
        Toque no cartão para ver detalhes · ⚙ para configurar · + para adicionar compra
      </p>

      {settingsCard && (
        <CardSettingsSheet
          accountName={settingsCard}
          onClose={() => setSettingsCard(null)}
          onSaved={() => { setSettingsCard(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}
