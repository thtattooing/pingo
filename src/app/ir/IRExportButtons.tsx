"use client";

interface IrField {
  id: string;
  label: string;
  fieldIR: string;
  total: number;
}

interface Investment {
  name: string;
  type: string;
  amount: number;
}

interface SavingsGoal {
  name: string;
  target_amount: number;
  current_amount: number;
}

export default function IRExportButtons({
  ano,
  userName,
  irData,
  bensInvest,
  bensMetas,
}: {
  ano: number;
  userName: string;
  irData: IrField[];
  bensInvest: Investment[];
  bensMetas: SavingsGoal[];
}) {
  function downloadCSV() {
    const BRL = (v: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    const rows: string[][] = [
      [`PINGO — Guia IRPF ${ano} — ${userName}`],
      [`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`],
      [],
      ["CAMPO IR", "FICHA / LOCALIZAÇÃO", "VALOR"],
      ...irData.map(f => [f.label, f.fieldIR, BRL(f.total)]),
    ];

    if (bensInvest.length > 0 || bensMetas.some(g => g.current_amount > 0)) {
      rows.push([]);
      rows.push(["BENS E DIREITOS", "Ficha 7 — Grupo 04", ""]);
      bensInvest.forEach(inv => {
        rows.push([inv.name, inv.type, BRL(Number(inv.amount))]);
      });
      bensMetas.filter(g => g.current_amount > 0).forEach(g => {
        rows.push([`${g.name} (reserva)`, "Poupança / reserva", BRL(Number(g.current_amount))]);
      });
    }

    rows.push([]);
    rows.push(["AVISO", "Confira todos os valores com seus comprovantes antes de declarar.", ""]);

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `PINGO_IR_${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={downloadCSV}
        className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.25)" }}
      >
        <i className="fa-solid fa-file-csv" />
        Exportar CSV para planilha
      </button>
      <button
        onClick={() => window.print()}
        className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary"
      >
        <i className="fa-solid fa-file-pdf mr-2" />
        Imprimir / Exportar PDF
      </button>
    </div>
  );
}
