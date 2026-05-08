import BottomNav from "@/components/BottomNav";

export default function IRPage() {
  return (
    <main className="flex flex-col min-h-screen safe-bottom px-5 pt-14">
      <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: "var(--font-calistoga)" }}>
        Imposto de Renda
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        Dados organizados para declaração — Fase 4
      </p>

      {[
        { icon: "fa-heart-pulse",     label: "Despesas médicas",   value: "R$ 2.340", color: "#EC4899", tag: "Dedutível" },
        { icon: "fa-graduation-cap",  label: "Educação",           value: "R$ 890",   color: "#06B6D4", tag: "Dedutível" },
        { icon: "fa-money-bill-wave", label: "Rendimentos",        value: "R$ 42.000",color: "#059669", tag: "Declarar" },
        { icon: "fa-triangle-exclamation", label: "Pix recorrentes",value: "+5k/mês", color: "#F59E0B", tag: "Atenção" },
      ].map((item, i) => (
        <div key={i} className="card-pingo flex items-center gap-4 mb-3 animate-fade-in-up" style={{ animationDelay: `${i*0.08}s` }}>
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${item.color}20` }}
          >
            <i className={`fa-solid ${item.icon}`} style={{ color: item.color }} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full mono-data"
              style={{ background: `${item.color}20`, color: item.color }}
            >
              {item.tag}
            </span>
          </div>
          <span className="mono-data text-sm font-semibold">{item.value}</span>
        </div>
      ))}

      <button className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary mt-4">
        <i className="fa-solid fa-file-pdf mr-2" />
        Exportar relatório para contador
      </button>

      <BottomNav />
    </main>
  );
}
