export interface ParsedRow {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // always positive
  type: "income" | "expense";
}

function parseDate(raw: string): string {
  const s = raw.trim().replace(/[\[\]]/g, "").split(/[-+T\s]/)[0];
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  // YYYYMMDD (OFX)
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  return s.slice(0, 10);
}

function csvSplit(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (const c of line) {
    if (c === '"') { q = !q; continue; }
    if (c === sep && !q) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  return [...out, cur.trim()];
}

function parseAmount(s: string): number {
  // Handle BRL: 1.234,56 → 1234.56  and  1234.56 → 1234.56
  const cleaned = s.replace(/[R$\s]/g, "").trim();
  // If comma is decimal separator (pt-BR): remove thousand dots, replace comma with dot
  if (/\d,\d{2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  return parseFloat(cleaned.replace(",", ""));
}

export function parseCSV(content: string): ParsedRow[] {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const hdr = csvSplit(lines[0].toLowerCase(), sep);

  const fi = (...terms: string[]) => hdr.findIndex(h => terms.some(t => h.includes(t)));
  const dateI = fi("data", "date");
  const descI = fi("descri", "title", "titulo", "lancamento", "lançamento", "histor", "memo");
  const amtI  = fi("valor", "amount", "quantia", "debit", "crédito", "credito");

  if (dateI === -1 || amtI === -1) return [];

  // Detect mixed-sign (account statement) vs all-positive (credit card = all expense)
  const samples = lines.slice(1, Math.min(8, lines.length))
    .map(l => parseAmount(csvSplit(l, sep)[amtI] ?? ""))
    .filter(n => !isNaN(n) && n !== 0);
  const mixed = samples.some(n => n < 0) && samples.some(n => n > 0);

  return lines.slice(1).flatMap(line => {
    const c = csvSplit(line, sep);
    const signed = parseAmount(c[amtI] ?? "");
    if (isNaN(signed) || signed === 0) return [];
    const type: "income" | "expense" = mixed ? (signed > 0 ? "income" : "expense") : "expense";
    const rawDesc = (descI >= 0 ? c[descI] : c[1]) || "Transação";
    return [{ date: parseDate(c[dateI] ?? ""), description: rawDesc, amount: Math.abs(signed), type }];
  });
}

export function parseOFX(content: string): ParsedRow[] {
  const isXML = content.includes("</STMTTRN>");

  const getVal = (block: string, tag: string): string => {
    const xml = block.match(new RegExp(`<${tag}\\b[^>]*>([^<]+)<\\/${tag}>`, "i"));
    if (xml) return xml[1].trim();
    const sgml = block.match(new RegExp(`<${tag}\\b[^>]*>([^\r\n<]+)`, "i"));
    return sgml ? sgml[1].trim() : "";
  };

  const blocks: string[] = [];
  if (isXML) {
    const re = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let m;
    while ((m = re.exec(content)) !== null) blocks.push(m[1]);
  } else {
    content.split(/<STMTTRN>/i).slice(1).forEach(p => blocks.push(p));
  }

  return blocks.flatMap(block => {
    const dt    = getVal(block, "DTPOSTED");
    const amt   = getVal(block, "TRNAMT");
    const ttype = getVal(block, "TRNTYPE");
    const memo  = getVal(block, "MEMO") || getVal(block, "NAME") || "Transação";
    if (!dt || !amt) return [];
    const signed = parseFloat(amt.replace(",", "."));
    if (isNaN(signed) || signed === 0) return [];
    return [{
      date: parseDate(dt),
      description: memo.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      amount: Math.abs(signed),
      type: (ttype.toUpperCase() === "CREDIT" || signed > 0 ? "income" : "expense") as "income" | "expense",
    }];
  });
}

export function detectBank(filename: string): string {
  const n = filename.toLowerCase();
  if (n.includes("nubank"))                         return "Nubank";
  if (n.includes("inter"))                          return "Inter";
  if (n.includes("c6"))                             return "C6 Bank";
  if (n.includes("bradesco"))                       return "Bradesco";
  if (n.includes("itau") || n.includes("itaú"))     return "Itaú";
  if (n.includes("caixa"))                          return "Caixa";
  if (n.endsWith(".ofx"))                           return "Banco (OFX)";
  return "Extrato";
}

export function parseFile(filename: string, content: string): ParsedRow[] {
  const n = filename.toLowerCase();
  const isOFX = n.endsWith(".ofx")
    || content.startsWith("OFXHEADER")
    || content.trimStart().startsWith("<OFX>");
  return isOFX ? parseOFX(content) : parseCSV(content);
}
