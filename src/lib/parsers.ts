export type TxType =
  | "pix_in" | "pix_out"
  | "debit"  | "credit"
  | "transfer_in" | "transfer_out" | "transfer_internal"
  | "boleto" | "fee" | "salary" | "deposit" | "withdrawal"
  | "unknown";

export interface ParsedRow {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // always positive
  type: "income" | "expense";
  txType?:              TxType;   // classified transaction type
  installmentTotal?:    number;   // total installments detected (e.g. 12)
  installmentCurrent?:  number;   // current installment (e.g. 2)
  installmentGroupKey?: string;   // cleaned description for grouping same-purchase rows
}

/** Classify transaction type from description + income/expense */
export function detectTxType(description: string, type: "income" | "expense"): TxType {
  const d = description.toLowerCase();

  // Transfer between own accounts — highest priority, prevents double counting
  if (
    /transfer[eê]ncia\s+entre\s+(contas?|conta)\s*(pr[oó]pria|pr[oó]prio)?/i.test(d) ||
    /\bpix\b.{0,30}\bvoc[eê]\b.{0,10}\bmesmo\b/i.test(d) ||
    /\bpago\s+por\s+voc[eê]\s+mesmo\b/i.test(d) ||
    /\benvio\s+para\s+voc[eê]\b/i.test(d)
  ) return "transfer_internal";

  // PIX
  if (/\bpix\b/i.test(d)) return type === "income" ? "pix_in" : "pix_out";

  // Salary
  if (/\b(sal[aá]rio|holerite|folha\s+de\s+pagamento|pagto?\s+sal[aá]rio)\b/i.test(d)) return "salary";

  // Transfer (TED / DOC / Transferência)
  if (/\b(transfer[eê]ncia|transf\.?\b|ted\b|doc\b)\b/i.test(d)) {
    return type === "income" ? "transfer_in" : "transfer_out";
  }

  // Boleto / bill / card payment
  if (
    /\b(boleto|bolet\.)\b/i.test(d) ||
    /pagamento\s+(?:de\s+)?(?:fatura|cart[aã]o|conta)/i.test(d) ||
    /pgto\s+(?:fat|cart)/i.test(d) ||
    /d[eé]bito\s+autom[aá]tico/i.test(d)
  ) return "boleto";

  // Bank fee / charge
  if (/\b(tarifa|taxa\s+|anuidade|iof|servi[cç]o\s+banc[aá]rio|tarifa\s+manut)\b/i.test(d)) return "fee";

  // Withdrawal
  if (type === "expense" && /\b(saque|retirada|caixa\s+eletr[oô]nico|atm\b)\b/i.test(d)) return "withdrawal";

  // Deposit
  if (type === "income" && /\b(dep[oó]sito|crédito\s+em\s+conta|cr[eé]dito\s+em\s+c\/c)\b/i.test(d)) return "deposit";

  return type === "income" ? "credit" : "debit";
}

/** Detect "2/12" style installment suffix in description */
export function extractInstallment(desc: string): {
  clean: string;
  total: number | null;
  current: number | null;
} {
  // Matches: " - 2/12", "(2/12)", " 2/12", "parc 2/12"
  const m = desc.match(/[\s\-\(](?:parc(?:ela)?\s*)?(\d{1,2})\s*\/\s*(\d{1,3})[\s\)]*$/i);
  if (m) {
    const current = parseInt(m[1]);
    const total   = parseInt(m[2]);
    if (total > 1 && total <= 72 && current >= 1 && current <= total) {
      return {
        clean:   desc.slice(0, m.index).replace(/[-\s]+$/, "").trim(),
        total,
        current,
      };
    }
  }
  return { clean: desc, total: null, current: null };
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

// ─────────────────────────────────────────── deaccent
function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ─────────────────────────────────────────── parseDate
function parseDate(raw: string): string {
  // Remove OFX timezone [...] and trim
  const s = raw.trim().replace(/\[.*?\]/g, "").trim();

  // YYYY-MM-DD (ISO, with optional time suffix)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // YYYYMMDD or YYYYMMDDHHMMSS (OFX)
  const yyyymmdd = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (yyyymmdd) return `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY (may have time after)
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;

  // DD MMM YYYY  e.g. "01 jan 2024", "01 Jan 2024", "01 janeiro 2024"
  const dmonthY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/i);
  if (dmonthY) {
    const MM: Record<string, string> = {
      jan:"01",fev:"02",feb:"02",mar:"03",abr:"04",apr:"04",
      mai:"05",may:"05",jun:"06",jul:"07",ago:"08",aug:"08",
      set:"09",sep:"09",out:"10",oct:"10",nov:"11",dez:"12",dec:"12",
    };
    const mm = MM[dmonthY[2].toLowerCase().slice(0, 3)] ?? "01";
    return `${dmonthY[3]}-${mm}-${dmonthY[1].padStart(2,"0")}`;
  }

  // Fallback: strip trailing time/space
  return s.replace(/[\sT].*/, "").slice(0, 10);
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
  // BRL: 1.234,56  or  1234,56
  if (/\d,\d{1,2}$/.test(v)) return parseFloat(v.replace(/\./g, "").replace(",", "."));
  // US/ISO: 1,234.56 or 1234.56
  return parseFloat(v.replace(/,/g, ""));
}

// ─────────────────────────────────────────── looksLikeDate
function looksLikeDate(v: string): boolean {
  const s = v.trim();
  return (
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(s) ||
    /^\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(s)      ||
    /^\d{8,14}$/.test(s.replace(/\s/g, ""))       ||
    /^\d{1,2}\s+[A-Za-z]{3}[a-z]*\.?\s+\d{4}/i.test(s)  // DD MMM YYYY
  );
}

// ─────────────────────────────────────────── parseCSV
export function parseCSV(content: string): { rows: ParsedRow[]; debug: ParseDebug } {
  const raw   = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim().length > 0);

  const emptyDebug = (msg = ""): { rows: ParsedRow[]; debug: ParseDebug } => ({
    rows: [],
    debug: { rawFirstLines: lines.slice(0, 6), sep: "", headers: [msg], dateCol: -1, descCol: -1, amtCol: -1, rowsParsed: 0 },
  });

  if (lines.length < 2) return emptyDebug("menos de 2 linhas");

  // ── Detect separator from the line with the most separators ──────────────
  const detectSep = (line: string) =>
    line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
  const sep = detectSep(lines.slice(0, 5).sort((a, b) => b.length - a.length)[0]);

  // ── Find actual header row (skip metadata / account-info preamble) ────────
  // C6, Bradesco, some Inter exports have 1-5 metadata lines before the header
  const HEADER_SIGNALS = [
    "data","date","lancamento","historico","valor","debito","credito",
    "amount","descri","transac","movimento","hist","periodo","competencia",
  ];
  let headerLine = 0;
  for (let i = 0; i < Math.min(10, lines.length - 1); i++) {
    const norm = deaccent(lines[i]).toLowerCase();
    if (HEADER_SIGNALS.some(sig => norm.includes(sig))) {
      headerLine = i;
      break;
    }
  }

  const hdr = csvSplit(lines[headerLine].toLowerCase().trim(), sep);

  // fi: find column index — ignores accents in both header and search terms
  const fi = (...terms: string[]) =>
    hdr.findIndex(h => {
      const nh = deaccent(h.trim());
      return terms.some(t => nh.includes(deaccent(t)));
    });

  // ── Column detection ──────────────────────────────────────────────────────
  let dateI = fi(
    "data", "date", "dt ", "dt.", "vencimento", "competencia", "periodo",
  );
  let descI = fi(
    "descri", "titulo", "title", "historico", "histor",
    "lancamento", "memo", "estabelecimento", "transac",
    "detalhe", "referencia", "nome", "operac", "narrativa",
  );

  // Split debit/credit columns (Itaú, Bradesco, Inter, Santander)
  const creditI = fi("credito", "credit", "entrada");
  const debitI  = fi("debito", "saida", "saida");
  const hasSplitCols = creditI >= 0 && debitI >= 0 && creditI !== debitI;

  let amtI = hasSplitCols ? -1 : fi(
    "valor", "amount", "quantia", "montante", "vlr", "vl.",
    "debito", "credito", "saida", "entrada", "mov.", "moviment",
  );

  // Nubank v2: "type" column with values "transaction" / "payment"
  const nuTypeI = fi("type");
  const dataRows = lines.slice(headerLine + 1, Math.min(headerLine + 8, lines.length)).map(l => csvSplit(l, sep));
  const sampleTypes = dataRows.map(r => (r[nuTypeI] ?? "").toLowerCase().trim()).filter(Boolean);
  const isNubankV2  = nuTypeI >= 0 && sampleTypes.length > 0 &&
    sampleTypes.every(v => ["transaction","payment","refund","credit_card_cashback","pix","international"].includes(v));

  // ── Content-based auto-detect (fallback for unknown/garbled headers) ───────
  const colCount = hdr.length;

  if (dateI === -1) {
    for (let col = 0; col < colCount; col++) {
      const vals = dataRows.map(r => (r[col] ?? "").trim()).filter(v => v.length > 0);
      if (vals.length > 0 && vals.every(v => looksLikeDate(v))) { dateI = col; break; }
    }
  }

  if (amtI === -1 && !hasSplitCols) {
    for (let col = colCount - 1; col >= 0; col--) {
      if (col === dateI || col === descI) continue;
      const vals   = dataRows.map(r => (r[col] ?? "").trim()).filter(v => v.length > 0);
      const parsed = vals.map(v => parseAmount(v));
      const valid  = parsed.filter(n => !isNaN(n));
      if (valid.length > 0 && valid.length >= vals.length * 0.5) { amtI = col; break; }
    }
  }

  const debug: ParseDebug = {
    rawFirstLines: lines.slice(0, 6),
    sep,
    headers: hdr,
    dateCol: dateI,
    descCol: descI,
    amtCol:  hasSplitCols ? creditI : amtI,
    rowsParsed: 0,
  };

  if (dateI === -1 || (amtI === -1 && !hasSplitCols)) return { rows: [], debug };

  // ── Mixed-sign detection ──────────────────────────────────────────────────
  const samples = hasSplitCols || isNubankV2
    ? []
    : lines.slice(headerLine + 1, Math.min(headerLine + 10, lines.length))
        .map(l => parseAmount(csvSplit(l, sep)[amtI] ?? ""))
        .filter(n => !isNaN(n) && n !== 0);
  const mixed = !hasSplitCols && !isNubankV2 && samples.some(n => n < 0) && samples.some(n => n > 0);

  // ── Row processing ────────────────────────────────────────────────────────
  const rows: ParsedRow[] = lines.slice(headerLine + 1).flatMap(line => {
    const c = csvSplit(line, sep);

    // Nubank v2: skip payment rows (they are bill payments, not expenses)
    if (isNubankV2) {
      const txType = (c[nuTypeI] ?? "").toLowerCase().trim();
      if (txType === "payment" || txType === "pagamento") return [];
    }

    let amount: number;
    let type: "income" | "expense";

    if (hasSplitCols) {
      const creditAmt = parseAmount(c[creditI] ?? "");
      const debitAmt  = parseAmount(c[debitI]  ?? "");
      const hasCredit = !isNaN(creditAmt) && Math.abs(creditAmt) > 0;
      const hasDebit  = !isNaN(debitAmt)  && Math.abs(debitAmt)  > 0;
      if (!hasCredit && !hasDebit) return [];
      amount = hasCredit ? Math.abs(creditAmt) : Math.abs(debitAmt);
      type   = hasCredit ? "income" : "expense";
    } else if (isNubankV2) {
      const raw = parseAmount(c[amtI] ?? "");
      if (isNaN(raw) || raw === 0) return [];
      amount = Math.abs(raw);
      type   = "expense"; // Nubank v2 credit card: all non-payment rows are expenses
    } else {
      const signed = parseAmount(c[amtI] ?? "");
      if (isNaN(signed) || signed === 0) return [];
      type   = mixed ? (signed > 0 ? "income" : "expense") : "expense";
      amount = Math.abs(signed);
    }

    const excludeCols = new Set([dateI, amtI, creditI, debitI, nuTypeI].filter(i => i >= 0));
    const rawDesc = (
      descI >= 0
        ? c[descI]
        : c.find((_, i) => !excludeCols.has(i))
    ) ?? "Transação";

    const raw = rawDesc || "Transação";
    const { clean, total, current } = extractInstallment(raw);

    return [{
      date:                 parseDate(c[dateI] ?? ""),
      description:          clean,
      amount,
      type,
      txType:               detectTxType(clean, type),
      installmentTotal:     total   ?? undefined,
      installmentCurrent:   current ?? undefined,
      installmentGroupKey:  total && current ? clean : undefined,
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
    const rawMemo = memo.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const { clean, total, current } = extractInstallment(rawMemo);
    const rowType = (ttype.toUpperCase() === "CREDIT" || signed > 0 ? "income" : "expense") as "income" | "expense";
    return [{
      date:                 parseDate(dt),
      description:          clean,
      amount:               Math.abs(signed),
      type:                 rowType,
      txType:               detectTxType(clean, rowType),
      installmentTotal:     total   ?? undefined,
      installmentCurrent:   current ?? undefined,
      installmentGroupKey:  total && current ? clean : undefined,
    }];
  });

  return {
    rows,
    debug: {
      rawFirstLines: content.split(/\r?\n/).slice(0, 5),
      sep: "OFX", headers: ["OFX/SGML"],
      dateCol: 0, descCol: 1, amtCol: 2, rowsParsed: rows.length,
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
