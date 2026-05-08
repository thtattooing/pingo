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
  const s = raw.trim()
    .replace(/\[.*?\]/g, "")   // remove OFX timezone [...]
    .replace(/T.*$/,      "")   // remove T... (ISO datetime)
    .replace(/\s.*/,      "")   // remove trailing time
    .trim();

  // YYYY-MM-DD (already correct — do NOT split on dash)
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
  let v = s.replace(/[R$\s"']/g, "").trim();
  if (!v || v === "-") return NaN;

  // BRL format: 1.234,56  or  1234,56  (comma = decimal)
  if (/\d,\d{1,2}$/.test(v)) {
    return parseFloat(v.replace(/\./g, "").replace(",", "."));
  }
  // US/ISO format: 1,234.56 or 1234.56
  return parseFloat(v.replace(/,/g, ""));
}

// ─────────────────────────────────────────── looksLikeDate (content-based)
function looksLikeDate(v: string): boolean {
  const s = v.trim();
  return (
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(s) ||   // DD/MM/YYYY
    /^\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(s) ||        // YYYY-MM-DD
    /^\d{8,14}$/.test(s.replace(/\s/g, ""))           // YYYYMMDD or timestamp
  );
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

  // ── Header-based column detection ──
  let dateI = fi(
    "data", "date", "dt ", "dt.", "vencimento", "competência", "competencia",
    "período", "periodo", "lançament", "lancament",
  );
  let descI = fi(
    "descri", "title", "titulo", "histórico", "historico", "histor",
    "memo", "estabelecimento", "transaç", "transac", "detalhe",
    "referência", "referencia", "nome", "operação", "operac", "narrativa",
  );

  // Split debit/credit detection (Itaú, Bradesco, Santander style)
  const creditI = fi("crédit", "credit", "entrada");
  const debitI  = fi("débito", "debito", "saída", "saida");
  const hasSplitCols = creditI >= 0 && debitI >= 0 && creditI !== debitI;

  let amtI = hasSplitCols ? -1 : fi(
    "valor", "amount", "quantia", "montante", "vlr", "vl.",
    "débito", "debito", "crédit", "credit", "saída", "saida", "entrada",
    "mov.", "moviment",
  );

  // ── Content-based auto-detect (fallback when headers are unknown/garbled) ──
  const dataRows = lines.slice(1, Math.min(7, lines.length)).map(l => csvSplit(l, sep));
  const colCount = hdr.length;

  if (dateI === -1) {
    for (let col = 0; col < colCount; col++) {
      const vals = dataRows.map(r => (r[col] ?? "").trim()).filter(v => v.length > 0);
      if (vals.length > 0 && vals.every(v => looksLikeDate(v))) {
        dateI = col;
        break;
      }
    }
  }

  if (amtI === -1 && !hasSplitCols) {
    // Scan from right — amount is typically near the end
    for (let col = colCount - 1; col >= 0; col--) {
      if (col === dateI || col === descI) continue;
      const vals = dataRows.map(r => (r[col] ?? "").trim()).filter(v => v.length > 0);
      const parsed = vals.map(v => parseAmount(v));
      const valid  = parsed.filter(n => !isNaN(n));
      if (valid.length > 0 && valid.length >= vals.length * 0.5) {
        amtI = col;
        break;
      }
    }
  }

  const debug: ParseDebug = {
    rawFirstLines: lines.slice(0, 4),
    sep,
    headers: hdr,
    dateCol: dateI,
    descCol: descI,
    amtCol:  hasSplitCols ? creditI : amtI,
    rowsParsed: 0,
  };

  if (dateI === -1 || (amtI === -1 && !hasSplitCols)) return { rows: [], debug };

  // ── Mixed-sign detection (for non-split single-column format) ──
  const samples = hasSplitCols
    ? []
    : lines.slice(1, Math.min(10, lines.length))
        .map(l => parseAmount(csvSplit(l, sep)[amtI] ?? ""))
        .filter(n => !isNaN(n) && n !== 0);
  const mixed = !hasSplitCols && samples.some(n => n < 0) && samples.some(n => n > 0);

  const rows: ParsedRow[] = lines.slice(1).flatMap(line => {
    const c = csvSplit(line, sep);

    let amount: number;
    let type: "income" | "expense";

    if (hasSplitCols) {
      const creditAmt = parseAmount(c[creditI] ?? "");
      const debitAmt  = parseAmount(c[debitI] ?? "");
      const hasCredit = !isNaN(creditAmt) && Math.abs(creditAmt) > 0;
      const hasDebit  = !isNaN(debitAmt)  && Math.abs(debitAmt) > 0;
      if (!hasCredit && !hasDebit) return [];
      amount = hasCredit ? Math.abs(creditAmt) : Math.abs(debitAmt);
      type   = hasCredit ? "income" : "expense";
    } else {
      const signed = parseAmount(c[amtI] ?? "");
      if (isNaN(signed) || signed === 0) return [];
      type   = mixed ? (signed > 0 ? "income" : "expense") : "expense";
      amount = Math.abs(signed);
    }

    const rawDesc = (
      descI >= 0
        ? c[descI]
        : c.find((_, i) => i !== dateI && i !== amtI && i !== creditI && i !== debitI)
    ) ?? "Transação";

    return [{
      date:        parseDate(c[dateI] ?? ""),
      description: rawDesc || "Transação",
      amount,
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
