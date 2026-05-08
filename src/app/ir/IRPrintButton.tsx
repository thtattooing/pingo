"use client";

export default function IRPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary"
    >
      <i className="fa-solid fa-file-pdf mr-2" />
      Exportar / Imprimir guia de declaração
    </button>
  );
}
