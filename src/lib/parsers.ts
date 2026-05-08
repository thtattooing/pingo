export interface ParsedRow {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // always positive
  type: "income" | "expense";
}

export interface ParseDebug {
  rawFirstLines: string[];
  sep: string;
  headers: string[];
  dateCol: number;
  descCol: number;
  amtCol: number;
  rowsParsed: number;
}

// ─────────────────────────────────────────── parseDate
function parseDate(raw: string): string {
  // Strip OFX timezone suffix like 20250115120000[-3:BRT] or 20250115120000+00
  const s = raw.trim()
    .replace(/\[.*?\]/g, "")   // remove [...]
    .replace(/T.*$/,      "")   // remove T... (ISO datetime)
    .replace(/\s.*/,      "")   // remove trailing time
    .trim();

  // YYYY-MM-DD (already correct — do NOT split on dash here)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;

  // YYYYMMDD (OFX raw, e.g. 20250115 or 20250115120000)
  const yyyymmdd = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (yyyymmdd) return `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`;

  return s.slice(0, 10);
}

// ─────────────────────────────────────────── csvSplit
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

// ─────────────────────────────────────────── parseAmount
function parseAmount(s: string): number {
  if (!s) return NaN;
  // Strip currency symbols, spaces and stray quotes
  let v = s.replace(/[R$\s"']/g, "").trim();
  if (!v) return NaN;

  // BRL format: 1.234,56  or  1234,56  (comma = decimal)
  if (/\d,\d{1,2}$/.test(v)) {
    return parseFloat(v.replace(/\./g, "").replace(",", "."));
  }
  // US/ISO format: 1,234.56 or 1234.56
  return parseFloat(v.replace(/,/g, ""));
}

// ─────────────────────────────────────────── parseCSV
export function parseCSV(content: string): { rows: ParsedRow[]; debug: ParseDebug } {
  // Strip BOM
  const raw = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim().length > 0);

  const emptyDebug = (msg = ""): { rows: ParsedRow[]; debug: ParseDebug } => ({
    rows: [],
    debug: { rawFirstLines: lines.slice(0, 4), sep: "", headers: [msg], dateCol: -1, descCol: -1, amtCol: -1, rowsParsed: 0 },
  });

  if (lines.length < 2) return emptyDebug("menos de 2 linhas");

  // Detect separator: semicolon > tab > comma
  const sep = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
  const hdr = csvSplit(lines[0].toLowerCase().trim(), sep);

  const fi = (...terms: string[]) =>
    hdr.findIndex(h => terms.some(t => h.trim().includes(t)));

  const dateI = fi(
    "data", "date", "dt ", "dt.", "vencimento", "competência", "competencia", "período", "periodo",
  );
  const descI = fi(
    "descri", "title", "titulo", "lancamento", "lançamento",
    "histórico", "historico", "histor", "memo", "estabelecimento",
    "transaç", "transac", "detalhe", "referência", "referencia", "nome",
  );
  const amtI = fi(
    "valor", "amount", "quantia", "montante", "vlr", "vl.",
    "débito", "debito", "crédit", "credit",
    "saída", "saida", "entrada",
  );

  const debug: ParseDebug = {
    rawFirstLines: lines.slice(0, 4),
    sep,
    headers: hdr,
    dateCol: dateI,
    descCol: descI,
    amtCol:  amtI,
    rowsParsed: 0,
  };

  if (dateI === -1 || amtI === -1) return { rows: [], debug };

  // Detect mixed-sign: account statement (income + expense) vs credit card (all expense)
  const samples = lines.slice(1, Math.min(10, lines.length))
    .map(l => parseAmount(csvSplit(l, sep)[amtI] ?? ""))
    .filter(n => !isNaN(n) && n !== 0);
  const mixed = samples.some(n => n < 0) && samples.some(n => n > 0);

  const rows: ParsedRow[] = lines.slice(1).flatMap(line => {
    const c      = csvSplit(line, sep);
    const signed = parseAmount(c[amtI] ?? "");
    if (isNaN(signed) || signed === 0) return [];

    const type: "income" | "expense" = mixed
      ? (signed > 0 ? "income" : "expense")
      : "expense"; // credit card: all positive = all expenses

    const rawDesc = (descI >= 0 ? c[descI] : c.find((_, i) => i !== dateI && i !== amtI)) ?? "Transação";

    return [{
      date:        parseDate(c[dateI] ?? ""),
      description: rawDesc || "Transação",
      amount:      Math.abs(signed),
      type,
    }];
  });

  debug.rowsParsed = rows.length;
  return { rows, debug };
}

// ─────────────────────────────────────────── parseOFX
export function parseOFX(content: string): { rows: ParsedRow[]; debug: ParseDebug } {
  const isXML = content.includes("</STMTTRN>");

  const getVal = (block: string, tag: string): string => {
    const xml  = block.match(new RegExp(`<${tag}\\b[^>]*>([^<]+)<\\/${tag}>`, "i"));
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

  const rows: ParsedRow[] = blocks.flatMap(block => {
    const dt    = getVal(block, "DTPOSTED");
    const amt   = getVal(block, "TRNAMT");
    const ttype = getVal(block, "TRNTYPE");
    const memo  = getVal(block, "MEMO") || getVal(block, "NAME") || "Transação";
    if (!dt || !amt) return [];
    const signed = parseFloat(amt.replace(",", "."));
    if (isNaN(signed) || signed === 0) return [];
    return [{
      date:        parseDate(dt),
      description: memo.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      amount:      Math.abs(signed),
      type:        (ttype.toUpperCase() === "CREDIT" || signed > 0 ? "income" : "expense") as "income" | "expense",
    }];
  });

  return {
    rows,
    debug: {
      rawFirstLines: content.split(/\r?\n/).slice(0, 5),
      sep:       "OFX",
      headers:   ["OFX/SGML"],
      dateCol:   0,
      descCol:   1,
      amtCol:    2,
      rowsParsed: rows.length,
    },
  };
}

// ─────────────────────────────────────────── detectBank
export function detectBank(filename: string): string {
  const n = filename.toLowerCase();
  if (n.includes("nubank"))                       return "Nubank";
  if (n.includes("inter"))                        return "Inter";
  if (n.includes("c6"))                           return "C6 Bank";
  if (n.includes("bradesco"))                     return "Bradesco";
  if (n.includes("itau") || n.includes("itaú"))   return "Itaú";
  if (n.includes("caixa"))                        return "Caixa";
  if (n.includes("santander"))                    return "Santander";
  if (n.endsWith(".ofx"))                         return "Banco (OFX)";
  return "Extrato";
}

// ─────────────────────────────────────────── parseFile
export function parseFile(filename: string, content: string): { rows: ParsedRow[]; debug: ParseDebug } {
  const n     = filename.toLowerCase();
  const isOFX = n.endsWith(".ofx")
    || content.startsWith("OFXHEADER")
    || content.trimStart().startsWith("<OFX>");
  return isOFX ? parseOFX(content) : parseCSV(content);
}
