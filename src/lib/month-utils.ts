export function parseMonthParam(m?: string): { month: number; year: number } {
  const now = new Date();
  if (m) {
    const [y, mo] = m.split("-").map(Number);
    if (y > 2000 && mo >= 1 && mo <= 12) return { month: mo, year: y };
  }
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function monthRange(month: number, year: number) {
  const mStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const mEnd =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { mStart, mEnd };
}
