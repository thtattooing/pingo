"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, detectCategory } from "@/lib/categories";
import BottomNav from "@/components/BottomNav";

interface ParsedTransaction {
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  installments?: number;
}

function parseText(text: string): ParsedTransaction | null {
  const lower = text.toLowerCase();

  // Detecta valor
  const amountMatch = text.match(/R?\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d+)?)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/\./g, "").replace(",", "."));
  if (isNaN(amount) || amount <= 0) return null;

  // Detecta tipo
  const incomeWords = ["recebi","recebia","salario","salário","freelance","renda","entrada","pagamento recebido","depositaram","caiu"];
  const isIncome = incomeWords.some(w => lower.includes(w));

  // Detecta parcelas
  const installMatch = text.match(/(\d+)x/i);
  const installments = installMatch ? parseInt(installMatch[1]) : undefined;

  // Detecta categoria
  const categoryId = detectCategory(text);

  return {
    description: text.replace(amountMatch[0], "").trim().replace(/^(gastei|paguei|comprei|recebi|fiz)\s*/i, "").trim() || text,
    amount,
    type: isIncome ? "income" : "expense",
    categoryId,
    installments,
  };
}

const SUGGESTIONS = [
  { icon: "fa-cart-shopping", label: "Fiz compras no mercado", color: "#F59E0B" },
  { icon: "fa-car",           label: "Paguei Uber",             color: "#3B82F6" },
  { icon: "fa-money-bill-wave", label: "Recebi salário",        color: "#059669" },
  { icon: "fa-heart-pulse",   label: "Fui ao médico",           color: "#EC4899" },
  { icon: "fa-house",         label: "Paguei aluguel",          color: "#8B5CF6" },
];

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function LancamentoPage() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(val: string) {
    setText(val);
    if (val.length > 5) {
      setParsed(parseText(val));
    } else {
      setParsed(null);
    }
    setSaved(false);
  }

  function handleSuggestion(label: string) {
    handleChange(label);
  }

  function handleSave() {
    if (!parsed) return;
    // TODO: salvar no Supabase
    setSaved(true);
    setTimeout(() => {
      setText("");
      setParsed(null);
      setSaved(false);
      router.push("/");
    }, 1200);
  }

  const cat = parsed ? (CATEGORIES.find(c => c.id === parsed.categoryId) ?? CATEGORIES[CATEGORIES.length - 1]) : null;

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--input)" }}
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <div>
          <h1 className="font-semibold text-base">Lançar</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Diga o que aconteceu
          </p>
        </div>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-5">
        {/* Input de texto */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)" }}
            >
              <i className="fa-solid fa-comment-dots text-white text-sm" />
            </div>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => handleChange(e.target.value)}
              placeholder="Ex: gastei 85 reais no almoço&#10;recebi salário de 4500&#10;paguei academia 99,90"
              rows={3}
              className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-[var(--muted-foreground)] leading-relaxed"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Preview do lançamento */}
        {parsed && !saved && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-4 animate-fade-in-up"
            style={{ background: "var(--card)", border: `1px solid ${parsed.type === "income" ? "rgba(5,150,105,0.3)" : "rgba(59,130,246,0.3)"}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-wand-magic-sparkles text-xs" style={{ color: "var(--primary)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                Detectado automaticamente
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: cat ? `${cat.color}20` : "var(--muted)" }}
              >
                <i className={`fa-solid ${cat?.icon ?? "fa-ellipsis"} text-lg`} style={{ color: cat?.color }} />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm capitalize truncate">{parsed.description || "Transação"}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {cat?.name} · {parsed.type === "income" ? "Entrada" : "Saída"}
                  {parsed.installments ? ` · ${parsed.installments}x` : ""}
                </p>
              </div>
              <span
                className="mono-data font-semibold text-base"
                style={{ color: parsed.type === "income" ? "var(--income)" : "var(--expense)" }}
              >
                {parsed.type === "income" ? "+" : "-"}{formatBRL(parsed.amount)}
              </span>
            </div>

            {/* Seletor de categoria */}
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Alterar categoria</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {CATEGORIES.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setParsed(prev => prev ? { ...prev, categoryId: c.id } : null)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl flex-shrink-0 transition-all"
                    style={{
                      background: parsed.categoryId === c.id ? `${c.color}25` : "var(--input)",
                      border: parsed.categoryId === c.id ? `1px solid ${c.color}60` : "1px solid transparent",
                      minWidth: 56,
                    }}
                  >
                    <i className={`fa-solid ${c.icon} text-sm`} style={{ color: c.color }} />
                    <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary"
            >
              <i className="fa-solid fa-check mr-2" />
              Confirmar lançamento
            </button>
          </div>
        )}

        {/* Sucesso */}
        {saved && (
          <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3 animate-fade-in-up"
            style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.3)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(5,150,105,0.2)" }}
            >
              <i className="fa-solid fa-check text-2xl text-income" />
            </div>
            <p className="font-semibold text-income">Lançado com sucesso!</p>
            <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
              Redirecionando para o início...
            </p>
          </div>
        )}

        {/* Sugestões rápidas */}
        {!parsed && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              SUGESTÕES RÁPIDAS
            </p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s.label)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-98 animate-fade-in-up"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}20` }}
                >
                  <i className={`fa-solid ${s.icon} text-sm`} style={{ color: s.color }} />
                </span>
                <span className="text-sm">{s.label}</span>
                <i className="fa-solid fa-chevron-right text-xs ml-auto" style={{ color: "var(--muted-foreground)" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
