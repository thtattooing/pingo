import BottomNav from "@/components/BottomNav";

export default function HistoricoPage() {
  return (
    <main className="flex flex-col min-h-screen safe-bottom px-5 pt-14">
      <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: "var(--font-calistoga)" }}>
        Histórico
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
        Sua linha do tempo financeira — Fase 3
      </p>
      <div className="flex flex-col gap-3">
        {["Jan","Fev","Mar","Abr","Mai"].map((m, i) => (
          <div key={m} className="card-pingo flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i*0.07}s` }}>
            <span className="mono-data text-sm w-8 text-center" style={{ color: "var(--muted-foreground)" }}>{m}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${[65,48,80,55,30][i]}%`,
                  background: [65,48,80,55,30][i] < 60
                    ? "var(--income)"
                    : "linear-gradient(90deg, var(--primary), var(--income))",
                }}
              />
            </div>
            <span className="mono-data text-xs" style={{ color: "var(--muted-foreground)" }}>
              R$ {[3200,2800,4100,2950,1800][i].toLocaleString("pt-BR")}
            </span>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
