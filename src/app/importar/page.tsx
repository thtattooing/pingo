import BottomNav from "@/components/BottomNav";

export default function ImportarPage() {
  return (
    <main className="flex flex-col min-h-screen safe-bottom px-5 pt-14">
      <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: "var(--font-calistoga)" }}>
        Importar extrato
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
        Em breve — Fase 2
      </p>
      <div
        className="card-pingo flex flex-col items-center gap-4 py-12 text-center"
        style={{ border: "2px dashed var(--border)" }}
      >
        <i className="fa-solid fa-file-arrow-up text-4xl" style={{ color: "var(--primary)" }} />
        <div>
          <p className="font-semibold">Arraste o extrato aqui</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            CSV · OFX · PDF — Nubank, Inter, C6
          </p>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full mono-data"
          style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
        >
          Em desenvolvimento
        </span>
      </div>
      <BottomNav />
    </main>
  );
}
