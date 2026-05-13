export interface InstallmentInfo {
  total: number;
  current: number;
}

/** Detect "3x", "12x", "parc 2/6" patterns in a description */
export function detectInstallments(text: string): InstallmentInfo | null {
  // "parc 2/6" or "2/12"
  const fracMatch = text.match(/parc(?:ela)?\s*(\d+)[\s/](\d+)/i) ?? text.match(/\((\d+)\/(\d+)\)/);
  if (fracMatch) {
    const current = parseInt(fracMatch[1]);
    const total   = parseInt(fracMatch[2]);
    if (total > 1 && current >= 1 && current <= total) return { total, current };
  }

  // "12x" standalone
  const xMatch = text.match(/\b(\d+)x\b/i);
  if (xMatch) {
    const total = parseInt(xMatch[1]);
    if (total > 1 && total <= 72) return { total, current: 1 };
  }

  return null;
}

/** Build the "(N/Total)" suffix found in lancamento descriptions */
export function installmentSuffix(current: number, total: number): string {
  return `(${current}/${total})`;
}

/** True if this transaction is part of an installment series */
export function isInstallment(installments?: number | null): boolean {
  return typeof installments === "number" && installments > 1;
}
