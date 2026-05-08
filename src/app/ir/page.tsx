import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import IRPrintButton from "./IRPrintButton";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// IR mapping: which PINGO categories feed each IR field
const IR_FIELDS = [
  {
    id:          "rendimentos_tributaveis",
    label:       "Rendimentos Tributáveis",
    desc:        "Salário, pró-labore, aluguéis recebidos, prestação de serviços",
    fieldIR:     "Ficha 1 — Rendimentos Tributáveis Recebidos de PJ",
    icon:        "fa-money-bill-wave",
    color:       "#10B981",
    categories:  ["salario", "freelance"],
    type:        "income" as const,
    important:   true,
  },
  {
    id:          "rendimentos_isentos",
    label:       "Rendimentos Isentos / Não Tributáveis",
    desc:        "Dividendos, LCI/LCA, poupança, FGTS, PLR, bolsas",
    fieldIR:     "Ficha 5 — Rendimentos Isentos e Não Tributáveis",
    icon:        "fa-chart-line",
    color:       "#6366F1",
    categories:  ["investimento"],
    type:        "income" as const,
    important:   true,
  },
  {
    id:          "deducoes_medicas",
    label:       "Despesas Médicas",
    desc:        "Consultas, exames, internações, plano de saúde — sem limite de dedução",
    fieldIR:     "Ficha 9 — Pagamentos Efetuados → Despesas Médicas",
    icon:        "fa-heart-pulse",
    color:       "#EC4899",
    categories:  ["saude"],
    type:        "expense" as const,
    important:   true,
  },
  {
    id:          "deducoes_educacao",
    label:       "Educação",
    desc:        "Ensino fundamental, médio, graduação, pós. Limite por dependente: R$ 3.561,50/ano",
    fieldIR:     "Ficha 9 — Pagamentos Efetuados → Instrução",
    icon:        "fa-graduation-cap",
    color:       "#06B6D4",
    categories:  ["educacao"],
    type:        "expense" as const,
    important:   true,
  },
  {
    id:          "outras_despesas",
    label:       "Outras Despesas",
    desc:        "Demais gastos do ano — geralmente não dedutíveis, mas úteis para controle",
    fieldIR:     "Referência para conferência do padrão de vida",
    icon:        "fa-receipt",
    color:       "#64748B",
    categories:  ["alimentacao","transporte","moradia","lazer","assinaturas","energia","agua","vestuario","outros"],
    type:        "expense" as const,
    important:   false,
  },
];

export default async function IRPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now    = new Date();
  // Default: previous year (what you declare this year)
  const ano    = parseInt(params.ano ?? String(now.getFullYear() - 1));
  const years  = [now.getFullYear() - 1, now.getFullYear() - 2, now.getFullYear()];

  // Fetch all transactions for the selected year
  const { data: txRows } = await supabase
    .from("transactions")
    .select("amount, type, category_id")
    .eq("user_id", user.id)
    .gte("date", `${ano}-01-01`)
    .lte("date", `${ano}-12-31`);

  const txList = txRows ?? [];

  // Aggregate by category
  const catTotals = new Map<string, number>();
  txList.forEach(t => {
    const key = `${t.category_id ?? "outros"}__${t.type}`;
    catTotals.set(key, (catTotals.get(key) ?? 0) + Number(t.amount));
  });

  // Calculate totals for each IR field
  const irData = IR_FIELDS.map(field => {
    const total = field.categories.reduce((sum, catId) => {
      return sum + (catTotals.get(`${catId}__${field.type}`) ?? 0);
    }, 0);
    return { ...field, total };
  });

  const totalTributavel = irData.find(f => f.id === "rendimentos_tributaveis")?.total ?? 0;
  const totalMedico     = irData.find(f => f.id === "deducoes_medicas")?.total ?? 0;
  const totalEducacao   = irData.find(f => f.id === "deducoes_educacao")?.total ?? 0;
  const totalDeducoes   = totalMedico + totalEducacao;
  const baseCalculo     = Math.max(totalTributavel - totalDeducoes, 0);

  const userName = user.user_metadata?.full_name ?? user.email ?? "você";

  return (
    <main className="flex flex-col min-h-screen safe-bottom">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page {
            background: white !important;
            color: #111 !important;
            font-family: Arial, sans-serif;
          }
          body { background: white !important; }
        }
      `}</style>

      {/* ── HEADER (no print) ── */}
      <header className="no-print px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-normal leading-tight"
              style={{ fontFamily: "var(--font-calistoga)" }}
            >
              Imposto de Renda
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Dados organizados para declaração
            </p>
          </div>
          {/* Year selector */}
          <div className="flex gap-1">
            {years.map(y => (
              <a
                key={y}
                href={`/ir?ano=${y}`}
                className="text-xs px-3 py-1.5 rounded-lg mono-data transition-all"
                style={{
                  background: ano === y ? "var(--primary)" : "var(--input)",
                  color: ano === y ? "white" : "var(--muted-foreground)",
                }}
              >
                {y}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── PRINT HEADER (print only) ── */}
      <div className="hidden print:block print-page px-8 pt-6 pb-2">
        <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
          PINGO — Guia de Declaração IRPF {ano}
        </h1>
        <p style={{ fontSize: 12, color: "#666" }}>
          Contribuinte: {userName} · Gerado em {new Date().toLocaleDateString("pt-BR")}
        </p>
        <hr style={{ margin: "12px 0", borderColor: "#ddd" }} />
        <p style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>
          Este guia resume seus dados financeiros registrados no PINGO para auxiliar o
          preenchimento da declaração de IRPF {ano + 1} (ano-calendário {ano}).
          Confira cada valor com seus comprovantes antes de declarar.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4 print-page">

        {/* Summary card */}
        <div
          className="card-glow animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.1) 0%, rgba(99,102,241,0.1) 100%)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
            Resumo {ano}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>Rendimentos</p>
              <p className="mono-data text-sm font-semibold" style={{ color: "var(--income)" }}>
                {BRL(totalTributavel)}
              </p>
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>Deduções</p>
              <p className="mono-data text-sm font-semibold" style={{ color: "var(--primary)" }}>
                {BRL(totalDeducoes)}
              </p>
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>Base cálculo</p>
              <p className="mono-data text-sm font-semibold" style={{ color: "var(--gold)" }}>
                {BRL(baseCalculo)}
              </p>
            </div>
          </div>
        </div>

        {/* IR Fields */}
        {irData.filter(f => f.important || f.total > 0).map((field, i) => (
          <div
            key={field.id}
            className="card-pingo flex flex-col gap-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="flex items-start gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${field.color}20` }}
              >
                <i className={`fa-solid ${field.icon}`} style={{ color: field.color }} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{field.label}</p>
                  <p
                    className="mono-data text-base font-semibold flex-shrink-0"
                    style={{ color: field.total > 0 ? field.color : "var(--muted-foreground)" }}
                  >
                    {field.total > 0 ? BRL(field.total) : "—"}
                  </p>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {field.desc}
                </p>
              </div>
            </div>

            {/* Where to put in IR program */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: `${field.color}10`, border: `1px solid ${field.color}25` }}
            >
              <i className="fa-solid fa-location-dot text-xs flex-shrink-0" style={{ color: field.color }} />
              <p className="text-[11px] font-medium" style={{ color: field.color }}>
                {field.fieldIR}
              </p>
            </div>

            {/* Zero state hint */}
            {field.total === 0 && field.important && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma transação desta categoria em {ano}. Se houver valores, lance manualmente.
              </p>
            )}
          </div>
        ))}

        {/* Education limit alert */}
        {totalEducacao > 3561.50 && (
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <i className="fa-solid fa-triangle-exclamation text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>
                Limite de educação atingido
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Você gastou {BRL(totalEducacao)} em educação, mas o limite dedutível é {BRL(3561.50)} por
                dependente. Declare apenas o valor permitido.
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card-pingo flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Lembrete antes de declarar
          </p>
          {[
            "Guarde todos os recibos médicos — a Receita pode pedir comprovantes",
            "Informe CNPJ do médico/clínica no campo de despesas médicas",
            "Rendimentos de investimentos podem ter tributação na fonte (verifique o informe)",
            "Bens acima de R$ 300 (veículos, imóveis, investimentos) devem constar na Ficha de Bens",
            "Declare dependentes para aumentar as deduções de educação e saúde",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <i className="fa-solid fa-circle-check text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--income)" }} />
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tip}</p>
            </div>
          ))}
        </div>

        {/* Export button */}
        <div className="no-print">
          <IRPrintButton />
        </div>

        <div className="no-print h-2" />
      </div>

      <div className="no-print">
        <BottomNav />
      </div>
    </main>
  );
}
