"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { parseFile, detectBank, detectTxType, ParsedRow, ParseDebug } from "@/lib/parsers";
import { CATEGORIES, detectCategory, mapBankCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { loadCategoryRules, descriptionKey } from "@/lib/category-memory";

/* ─────────────────────────────────────────── types */
type Step = "type" | "drop" | "account" | "preview" | "done";
type AccountType = "credit_card" | "checking";

interface AccountInfo {
  type: AccountType;
  name: string;
}

interface ImportRow extends ParsedRow {
  uid: string;
  categoryId: string;
  subcategory: string;
  selected: boolean;
  isDupe: boolean;
  isPossibleDupe: boolean;
  isRecurring: boolean;
  shouldExclude: boolean;
  // installmentTotal, installmentCurrent, installmentGroupKey inherited from ParsedRow
}

interface Props {
  userId: string;
  recentHashes: string[];
  manualDateAmounts: string[];
  existingCards:    { name: string; color: string }[];
  existingAccounts: { name: string; type: string }[];
  preselectedCard?: { name: string; type: "credit_card" | "checking" };
}

/* ─────────────────────────────────────────── helpers */
const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Transações que representam liquidação de passivo (pagamento de fatura) ou
// movimentações patrimoniais entre contas próprias. Não são despesas operacionais
// e devem ser excluídas do import para evitar dupla contagem.
const EXCLUDE_KEYWORDS = [
  // ── Pagamento de fatura (lado extrato conta corrente) ──
  /pagamento\s+(?:de\s+)?(?:fatura|cartao|cart[aã]o)/i,
  /pgto\s+(?:fat|cart[aã]o)/i,
  /pagto\s+fat/i,
  /fat\s+(?:nubank|c6|inter|bradesco|ita[uú]|santander|xp|btg|sicredi|safra|original)/i,
  /d[eé]bito\s+autom[aá]tico\s+(?:cartao|cart[aã]o)/i,
  // Nubank extrato: "Nubank" ou "Nu Pagamentos" como beneficiário do PIX/TED
  // Sem âncora ^ para capturar "PIX ENVIADO NUBANK S.A." e similares
  /nu\s+pagamentos\s+s/i,
  /nubank\s+s\.?\s*a\.?/i,
  /pix\s+(?:enviado|transf|recebido|agendado).*(?:nubank|nu\s*pag)/i,
  // Inter extrato: pagamento de cartão via débito automático
  /banco\s+inter.*cart[aã]o/i,
  /inter.*fatura/i,
  /pix\s+(?:enviado|transf).*banco\s+inter/i,
  /pix\s+(?:enviado|transf).*inter\s+s\.?\s*a/i,
  // C6 extrato: pagamento da própria fatura
  /^fatura\s+de\s+cart[aã]o$/i,
  /^c6\s+bank.*fatura/i,
  /pix\s+(?:enviado|transf).*c6\s+bank/i,
  // Padrão genérico: "Pgto cartão" / "Pgt fatura" em qualquer banco
  /^pgt[oa]?\s+(?:fat|cart)/i,
  // PIX enviado para pagamento de fatura (sem especificar banco)
  /pix\s+(?:enviado|transf).*(?:fatura|pagamento\s+de\s+cart)/i,

  // ── Pagamento recebido (lado fatura cartão) ──
  /^pagamento\s+recebido$/i,
  /inclus[aã]o\s+de\s+pagamento/i,
  /pagamento\s+em\s+(?:fatura|conta)/i,

  // ── Transferências entre contas próprias ──
  /transfer[eê]ncia\s+entre\s+contas/i,
  /pix\s+enviado.*voc[eê]\s+mesmo/i,
  /transfer[eê]ncia\s+para\s+conta\s+pr[oó]pria/i,

  // ── Registro manual via PagarFaturaModal ──
  /^pagamento\s+fatura\s+/i,
];

function looksLikeExclude(desc: string): boolean {
  return EXCLUDE_KEYWORDS.some(re => re.test(desc));
}


function suggestAccountName(bank: string, type: AccountType): string {
  const suffix = type === "credit_card" ? "Crédito" : "Conta Digital";
  if (bank === "Extrato" || bank === "Banco (OFX)") return type === "credit_card" ? "Cartão de Crédito" : "Conta Corrente";
  return `${bank} ${suffix}`;
}

/* ─────────────────────────────────────────── AccountPicker */
function AccountPicker({
  type, name, existingCards, existingAccounts, onChange,
}: {
  type: AccountType;
  name: string;
  existingCards:    { name: string; color: string }[];
  existingAccounts: { name: string; type: string }[];
  onChange: (name: string) => void;
}) {
  const [custom, setCustom] = useState(false);

  const isCredit = type === "credit_card";
  const pool     = isCredit ? existingCards : existingAccounts;
  const hasPool  = pool.length > 0;

  // Credit cards: allow free text only when no cards are registered yet
  // (when pool exists, force selection from registered cards to avoid name mismatches)
  const showInput = isCredit ? !hasPool : (custom || !hasPool);

  const creditNoPool = isCredit && !hasPool;

  const fallbackSuggestions = isCredit
    ? ["Nubank", "Inter", "C6 Bank", "Bradesco", "Itaú", "Santander"]
    : ["Nubank Conta", "Inter Conta", "C6 Conta", "Bradesco Conta Corrente"];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {isCredit ? "Selecionar cartão" : "Selecionar conta"}
      </p>

      {/* Credit card with no registered cards → allow naming inline */}
      {creditNoPool && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.25)" }}>
          <i className="fa-solid fa-circle-info text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Digite um nome para este cartão. Depois de importar, vá em{" "}
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>Cartões</span>{" "}
            para cadastrá-lo com cor e limite.
          </p>
        </div>
      )}

      {/* Existing cards/accounts as chips */}
      {hasPool && (
        <div className="flex flex-col gap-2">
          {pool.map(p => {
            const selected = name === p.name;
            const bg = isCredit && "color" in p
              ? (p as { name: string; color: string }).color
              : "#8B5CF6";
            return (
              <button
                key={p.name}
                onClick={() => { onChange(p.name); setCustom(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: selected ? `${bg}18` : "var(--muted)",
                  border:     `1.5px solid ${selected ? bg : "transparent"}`,
                }}
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}>
                  <i className={`fa-solid ${isCredit ? "fa-credit-card" : "fa-building-columns"} text-xs text-white`} />
                </span>
                <span className="text-sm font-medium" style={{ color: selected ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  {p.name}
                </span>
                {selected && <i className="fa-solid fa-check ml-auto text-xs" style={{ color: bg }} />}
              </button>
            );
          })}

          {/* Contas correntes: permitir nome livre. Cartões: não — risco de mismatch */}
          {!isCredit && (
            <button
              onClick={() => { setCustom(true); onChange(""); }}
              className="text-xs text-left px-1"
              style={{ color: "var(--muted-foreground)" }}>
              + Outra conta
            </button>
          )}
        </div>
      )}

      {/* Free-form input — somente para contas correntes sem pool ou "Outra" */}
      {showInput && (
        <div>
          <input
            value={name}
            onChange={e => onChange(e.target.value)}
            placeholder={isCredit ? "Ex: Nubank, C6 Bank…" : "Ex: Inter Conta Digital…"}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: "var(--input)",
              border:     "1px solid var(--border)",
              color:      "var(--foreground)",
            }}
            autoFocus
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {fallbackSuggestions.map(s => (
              <button key={s} onClick={() => onChange(s)}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── component */
export default function ImportarClient({ userId, recentHashes, manualDateAmounts, existingCards, existingAccounts, preselectedCard }: Props) {
  const [step, setStep]           = useState<Step>(preselectedCard ? "drop" : "type");
  const [bankName, setBankName]   = useState("");
  const [rawRows, setRawRows]     = useState<ParsedRow[]>([]);
  const [account, setAccount]     = useState<AccountInfo>(
    preselectedCard
      ? { type: preselectedCard.type, name: preselectedCard.name }
      : { type: "credit_card", name: "" }
  );
  const [rows, setRows]           = useState<ImportRow[]>([]);
  const [saving, setSaving]       = useState(false);
  const [savedCount, setSavedCount]         = useState(0);
  const [futureInstCount, setFutureInstCount] = useState(0);
  const [dragOver, setDragOver]   = useState(false);
  const [parseDebug, setParseDebug] = useState<ParseDebug | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hashSet            = useMemo(() => new Set(recentHashes), [recentHashes]);
  const manualDateAmtSet   = useMemo(() => new Set(manualDateAmounts), [manualDateAmounts]);

  /* ── file processing ── */
  function processFile(file: File) {
    const applyResult = (parsed: ReturnType<typeof parseFile>) => {
      const bank = detectBank(file.name);
      setBankName(bank);
      setRawRows(parsed.rows);
      setParseDebug(parsed.debug);
      // Type already chosen explicitly by user (or locked by preselectedCard)
      if (!preselectedCard) {
        setAccount(a => {
          const pool = a.type === "credit_card" ? existingCards : existingAccounts;
          // Auto-select if there's exactly one option; otherwise suggest a name
          const autoName = pool.length === 1 ? pool[0].name : suggestAccountName(bank, a.type);
          return { ...a, name: autoName };
        });
      }
      setStep("account");
    };

    const tryRead = (encodings: string[]) => {
      const [enc, ...rest] = encodings;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result  = parseFile(file.name, content);
        // If garbled (replacement chars) and rows = 0, try next encoding
        if (result.rows.length === 0 && rest.length > 0 && content.includes("�")) {
          tryRead(rest);
          return;
        }
        applyResult(result);
      };
      reader.readAsText(file, enc);
    };

    tryRead(["UTF-8", "ISO-8859-1"]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [hashSet]);

  /* ── Preview (rule-based categorization, no external API) ── */
  async function runPreview() {
    const dedup = (r: ParsedRow) =>
      `${r.date}-${Number(r.amount).toFixed(2)}-${r.description.slice(0,15).toLowerCase().replace(/[^a-z0-9]/g,"")}`;

    const supabase = createClient();
    const rules = await loadCategoryRules(supabase, userId);

    const isCreditCard = (preselectedCard?.type ?? account.type) === "credit_card";

    const mapped: ImportRow[] = rawRows.map((r, i) => {
      const excluded      = looksLikeExclude(r.description);
      const hash          = dedup(r);
      const isDupe        = hashSet.has(hash);
      const dateAmtKey    = `${r.date}-${Number(r.amount).toFixed(2)}`;
      const isPossibleDupe = !excluded && !isDupe && manualDateAmtSet.has(dateAmtKey);
      const learned       = rules.get(descriptionKey(r.description));

      // Critical fix: credit card faturas use positive = expense convention.
      // The parser's "mixed mode" may incorrectly classify purchases as income.
      // Force all non-excluded CC rows to expense, except explicit refunds/cashbacks.
      let rowType = r.type;
      if (isCreditCard && !excluded) {
        const isRefund = /reembolso|estorno|cashback|devolu|credito\s*na\s*fatura/i.test(r.description);
        rowType = isRefund ? "income" : "expense";
      }

      // Category: learned rule > bank's own category > keyword detection
      const bankCatId = r.bankCategory ? mapBankCategory(r.bankCategory) : null;
      const categoryId = learned
        ?? (bankCatId && bankCatId !== "outros" ? bankCatId : null)
        ?? detectCategory(r.description);

      return {
        ...r,
        type:           rowType,
        uid:            `${i}-${r.date}-${r.amount}`,
        categoryId,
        subcategory:    "",
        selected:       !excluded && !isDupe,
        isDupe,
        isPossibleDupe,
        isRecurring:    false,
        shouldExclude:  excluded,
      };
    });

    setRows(mapped);
    setStep("preview");
  }

  /* ── row actions ── */
  const toggleRow = (uid: string) =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, selected: !r.selected } : r));
  const toggleAll = () => {
    const eligible = rows.filter(r => !r.isDupe && !r.shouldExclude);
    const allOn    = eligible.every(r => r.selected);
    setRows(p => p.map(r =>
      (!r.isDupe && !r.shouldExclude) ? { ...r, selected: !allOn } : r
    ));
  };
  const setCat  = (uid: string, catId: string) =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, categoryId: catId } : r));
  const setType = (uid: string, t: "income" | "expense") =>
    setRows(p => p.map(r => r.uid === uid ? { ...r, type: t } : r));

  /* ── save ── */
  async function handleImport() {
    const toSave = rows.filter(r => r.selected);
    if (!toSave.length) return;
    setSaving(true);
    setSaveError(null);
    setSchemaWarning(false);

    const supabase = createClient();

    // Build installment group IDs: same installmentGroupKey + same amount → same group
    const groupIdMap = new Map<string, string>();
    const getGroupId = (r: ImportRow): string | null => {
      if (!r.installmentGroupKey) return null;
      const key = `${r.installmentGroupKey}::${r.amount}`;
      if (!groupIdMap.has(key)) groupIdMap.set(key, crypto.randomUUID());
      return groupIdMap.get(key)!;
    };

    const dedupHash = (r: ImportRow) =>
      `${r.date}-${Number(r.amount).toFixed(2)}-${r.description.slice(0,15).toLowerCase().replace(/[^a-z0-9]/g,"")}`;

    // preselectedCard is the ground truth when coming from a card's import button
    const finalType = preselectedCard?.type ?? account.type;
    const finalName = preselectedCard?.name ?? account.name;

    const fullPayload = toSave.map(r => ({
      user_id:               userId,
      description:           r.description,
      amount:                r.amount,
      type:                  r.type,
      category_id:           r.categoryId,
      subcategory:           r.subcategory || null,
      date:                  r.date,
      is_imported:           true,
      is_recurring:          r.isRecurring,
      account_type:          finalType,
      account_name:          finalName,
      tx_type:               r.txType ?? detectTxType(r.description, r.type),
      installments:          r.installmentTotal          ?? 1,
      installment_current:   r.installmentCurrent        ?? 1,
      installment_group_id:  getGroupId(r),
      dedup_hash:            dedupHash(r),
    }));

    // ignoreDuplicates: false → ON CONFLICT DO UPDATE, so reimporting corrects account_type
    let { error } = await supabase.from("transactions").upsert(fullPayload, {
      onConflict: "user_id,account_name,dedup_hash",
      ignoreDuplicates: false,
    });

    // If columns don't exist yet (schema not migrated), retry with only base columns
    const isSchemaError = error && (
      error.code === "42703" ||
      error.code === "PGRST204" ||
      error.message?.toLowerCase().includes("column") ||
      error.message?.toLowerCase().includes("could not find") ||
      error.message?.toLowerCase().includes("does not exist")
    );
    if (isSchemaError) {
      setSchemaWarning(true);
      const basePayload = toSave.map(r => ({
        user_id:             userId,
        description:         r.description,
        amount:              r.amount,
        type:                r.type,
        category_id:         r.categoryId,
        date:                r.date,
        is_imported:         true,
        installments:        1,
        installment_current: 1,
      }));
      const fallback = await supabase.from("transactions").insert(basePayload);
      error = fallback.error;
    }

    if (error) {
      setSaving(false);
      setSaveError(error.message ?? "Erro ao salvar. Tente novamente.");
      return;
    }

    // Auto-generate future installment entries for parcelamentos
    // e.g. import "TV (2/12)" → also create (3/12)…(12/12) in future months
    let futureGenCount = 0;
    const futureRows: object[] = [];

    toSave.forEach(r => {
      const total   = r.installmentTotal   ?? 1;
      const current = r.installmentCurrent ?? 1;
      if (total <= 1 || current >= total) return;

      const groupId   = getGroupId(r);
      const cleanDesc = r.description.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
      const [oy, om, od] = r.date.split("-").map(Number);
      const txType    = r.txType ?? detectTxType(r.description, r.type);

      for (let i = 1; i <= total - current; i++) {
        const instNum    = current + i;
        let fm = om + i, fy = oy;
        while (fm > 12) { fm -= 12; fy++; }
        const maxDay = new Date(fy, fm, 0).getDate();
        const fd     = Math.min(od, maxDay);
        const fDate  = `${fy}-${String(fm).padStart(2,"0")}-${String(fd).padStart(2,"0")}`;
        const fDesc  = `${cleanDesc} (${instNum}/${total})`;
        const fHash  = `${fDate}-${Number(r.amount).toFixed(2)}-${fDesc.slice(0,15).toLowerCase().replace(/[^a-z0-9]/g,"")}`;

        futureRows.push({
          user_id:               userId,
          description:           fDesc,
          amount:                r.amount,
          type:                  r.type,
          category_id:           r.categoryId,
          subcategory:           r.subcategory || null,
          date:                  fDate,
          is_imported:           true,
          is_recurring:          false,
          account_type:          finalType,
          account_name:          finalName,
          tx_type:               txType,
          installments:          total,
          installment_current:   instNum,
          installment_group_id:  groupId,
          dedup_hash:            fHash,
        });
      }
    });

    if (futureRows.length > 0) {
      const { error: futErr } = await supabase
        .from("transactions")
        .upsert(futureRows as any, {
          onConflict: "user_id,account_name,dedup_hash",
          ignoreDuplicates: true,
        });
      if (!futErr) futureGenCount = futureRows.length;
    }

    setSaving(false);
    setSavedCount(toSave.length);
    setFutureInstCount(futureGenCount);
    setStep("done");
  }

  const selectedCount   = rows.filter(r => r.selected).length;
  const excludedCount   = rows.filter(r => r.shouldExclude || r.isDupe).length;
  const pendingFutInst  = rows
    .filter(r => r.selected && (r.installmentTotal ?? 1) > 1 && (r.installmentCurrent ?? 1) < (r.installmentTotal ?? 1))
    .reduce((s, r) => s + ((r.installmentTotal ?? 1) - (r.installmentCurrent ?? 1)), 0);

  /* ══════════════════════ RENDER ══════════════════════ */

  /* TYPE PICKER */
  if (step === "type") return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <p className="text-sm font-medium px-1">O que você quer importar?</p>

      <button
        onClick={() => { setAccount(a => ({ ...a, type: "credit_card" })); setStep("drop"); }}
        className="flex items-center gap-4 p-5 rounded-3xl text-left transition-all active:scale-95"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 4px 14px rgba(244,114,182,0.35)" }}>
          <i className="fa-solid fa-credit-card text-xl text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Fatura de cartão de crédito</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Nubank, Inter, C6, Bradesco, Itaú...
          </p>
        </div>
        <i className="fa-solid fa-chevron-right text-xs" style={{ color: "var(--muted-foreground)" }} />
      </button>

      <button
        onClick={() => { setAccount(a => ({ ...a, type: "checking" })); setStep("drop"); }}
        className="flex items-center gap-4 p-5 rounded-3xl text-left transition-all active:scale-95"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
          <i className="fa-solid fa-building-columns text-xl text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Extrato de conta corrente</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Conta digital, poupança, conta corrente
          </p>
        </div>
        <i className="fa-solid fa-chevron-right text-xs" style={{ color: "var(--muted-foreground)" }} />
      </button>
    </div>
  );

  /* DROP */
  if (step === "drop") return (
    <div className="flex flex-col gap-5">
      {/* Type badge — shows what was chosen, tap to go back */}
      {!preselectedCard && (
        <button
          onClick={() => setStep("type")}
          className="flex items-center gap-2 self-start px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: account.type === "credit_card" ? "rgba(244,114,182,0.12)" : "rgba(99,102,241,0.12)",
            color: account.type === "credit_card" ? "var(--primary)" : "#6366F1",
          }}
        >
          <i className={`fa-solid ${account.type === "credit_card" ? "fa-credit-card" : "fa-building-columns"} text-[10px]`} />
          {account.type === "credit_card" ? "Fatura de cartão" : "Extrato conta corrente"}
          <i className="fa-solid fa-xmark text-[9px] opacity-60" />
        </button>
      )}

      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center gap-5 py-14 text-center cursor-pointer rounded-3xl transition-all"
        style={{
          background: dragOver ? "rgba(244,114,182,0.08)" : "var(--card)",
          border: `2px dashed ${dragOver ? "var(--primary)" : "rgba(244,114,182,0.3)"}`,
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.ofx,.txt" className="hidden"
          onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 20px rgba(244,114,182,0.3)" }}>
          <i className="fa-solid fa-file-arrow-up text-2xl text-white" />
        </div>
        <div>
          <p className="font-semibold text-base">
            {account.type === "credit_card" ? "Soltar fatura aqui" : "Soltar extrato aqui"}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Ou toque para selecionar</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {["Nubank CSV", "Inter OFX", "C6 Bank CSV"].map(b => <span key={b} className="badge-gold">{b}</span>)}
        </div>
      </div>

      <div className="card-pingo flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          Como exportar do seu banco
        </p>
        {[
          { bank: "Nubank",  icon: "fa-credit-card",     tip: "App → Fatura → Exportar fatura → CSV" },
          { bank: "Inter",   icon: "fa-mobile-screen",   tip: "App → Extrato → Exportar → OFX" },
          { bank: "C6 Bank", icon: "fa-building-columns",tip: "App → Extrato → Exportar CSV" },
        ].map(({ bank, icon, tip }) => (
          <div key={bank} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--muted)" }}>
              <i className={`fa-solid ${icon} text-sm`} style={{ color: "var(--primary)" }} />
            </span>
            <div>
              <p className="text-xs font-medium">{bank}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ACCOUNT SETUP */
  if (step === "account") return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="card-pingo flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" }}>
            <i className="fa-solid fa-file-invoice text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{bankName}</p>
            <p className="text-xs" style={{ color: rawRows.length === 0 ? "var(--expense)" : "var(--muted-foreground)" }}>
              {rawRows.length === 0 ? "Nenhuma transação detectada" : `${rawRows.length} transações detectadas`}
            </p>
          </div>
        </div>

        {/* ── DIAGNÓSTICO quando 0 linhas ou suspeito poucos ── */}
        {(rawRows.length === 0 || (rawRows.length > 0 && rawRows.length < 5)) && parseDebug && (
          <div className="flex flex-col gap-3 rounded-2xl p-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-sm" style={{ color: "var(--expense)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--expense)" }}>
                {rawRows.length === 0
                  ? "Não foi possível ler as colunas do arquivo"
                  : `Apenas ${rawRows.length} transação detectada — arquivo pode ter colunas não reconhecidas`}
              </p>
            </div>

            <div>
              <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--muted-foreground)" }}>
                Primeiras linhas do arquivo:
              </p>
              <div className="rounded-xl p-3 overflow-x-auto" style={{ background: "var(--card)" }}>
                {parseDebug.rawFirstLines.map((l, i) => (
                  <p key={i} className="mono-data text-[10px] leading-relaxed whitespace-pre"
                    style={{ color: i === 0 ? "var(--primary)" : "var(--foreground)" }}>
                    {l.slice(0, 120)}{l.length > 120 ? "…" : ""}
                  </p>
                ))}
              </div>
            </div>

            {parseDebug.headers.length > 1 && (
              <div>
                <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Colunas detectadas ({parseDebug.sep}):
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {parseDebug.headers.map((h, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full mono-data"
                      style={{
                        background: (i === parseDebug.dateCol || i === parseDebug.descCol || i === parseDebug.amtCol)
                          ? "rgba(244,114,182,0.2)" : "var(--muted)",
                        color: (i === parseDebug.dateCol || i === parseDebug.descCol || i === parseDebug.amtCol)
                          ? "var(--primary)" : "var(--muted-foreground)",
                      }}>
                      [{i}] {h}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                  Data: {parseDebug.dateCol >= 0 ? `coluna ${parseDebug.dateCol} ✓` : "não encontrada ✗"}
                  {" · "}
                  Valor: {parseDebug.amtCol >= 0 ? `coluna ${parseDebug.amtCol} ✓` : "não encontrada ✗"}
                </p>
              </div>
            )}

            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {rawRows.length === 0
                ? "Cole as primeiras linhas do arquivo em uma mensagem para eu ajustar o parser."
                : "Abra o arquivo no Bloco de Notas e cole as primeiras 10 linhas para diagnóstico."}
            </p>
          </div>
        )}

        {rawRows.length > 0 && (
        <>
        <p className="text-sm font-medium">
          {account.type === "credit_card" ? "Qual cartão é este?" : "Qual conta é esta?"}
        </p>

        {/* Account / Card picker — travado se veio do detalhe do cartão */}
        {preselectedCard ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.25)" }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary)" }}
            >
              <i className="fa-solid fa-credit-card text-xs text-white" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{preselectedCard.name}</p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                Fatura será importada para este cartão
              </p>
            </div>
            <i className="fa-solid fa-lock text-xs" style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <AccountPicker
            type={account.type}
            name={account.name}
            existingCards={existingCards}
            existingAccounts={existingAccounts}
            onChange={name => setAccount(a => ({ ...a, name }))}
          />
        )}

        {/* Info notice */}
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>
          <i className="fa-solid fa-tags text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Categorização automática por palavras-chave. Pagamentos de fatura e transferências
            entre contas são excluídos automaticamente para evitar duplicatas.
          </p>
        </div>

        {/* Bloquear se cartão de crédito sem cartão cadastrado e sem preselectedCard */}
        {(() => {
          const noName = !account.name.trim() && !preselectedCard;
          return (
            <button
              onClick={runPreview}
              disabled={noName}
              className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40">
              <i className="fa-solid fa-eye mr-2" />
              {noName ? "Escolha ou nomeie a conta" : "Ver transações"}
            </button>
          );
        })()}
        </>
        )}

        <div className="flex justify-between">
          {!preselectedCard && (
            <button onClick={() => setStep("type")} className="text-xs"
              style={{ color: "var(--muted-foreground)" }}>
              ← Trocar tipo
            </button>
          )}
          <button onClick={() => setStep("drop")} className="text-xs ml-auto"
            style={{ color: "var(--muted-foreground)" }}>
            ← Trocar arquivo
          </button>
        </div>
      </div>
    </div>
  );

  /* DONE */
  if (step === "done") return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center animate-coin-drop"
        style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)", boxShadow: "0 0 30px rgba(244,114,182,0.4)" }}>
        <i className="fa-solid fa-piggy-bank text-4xl text-white" />
      </div>
      <div>
        <p className="text-xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>Pingado!</p>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {savedCount} transações importadas · {account.name}
        </p>
        {futureInstCount > 0 && (
          <p className="text-xs mt-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
            <i className="fa-solid fa-calendar-days mr-1.5" />
            {futureInstCount} parcela{futureInstCount !== 1 ? "s" : ""} futura{futureInstCount !== 1 ? "s" : ""} criada{futureInstCount !== 1 ? "s" : ""} automaticamente
          </p>
        )}
      </div>
      <button onClick={() => { setStep(preselectedCard ? "drop" : "type"); setRows([]); setRawRows([]); setSavedCount(0); setFutureInstCount(0); }}
        className="btn-primary py-3 px-8">
        <i className="fa-solid fa-file-arrow-up mr-2" />Importar outro arquivo
      </button>
    </div>
  );

  /* PREVIEW */
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="card-pingo flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: account.type === "credit_card"
            ? "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)"
            : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
          <i className={`fa-solid ${account.type === "credit_card" ? "fa-credit-card" : "fa-building-columns"} text-white`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{account.name}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {rows.filter(r => r.selected).length} selecionadas
            {excludedCount > 0 && ` · ${excludedCount} ignoradas (fatura/dupl.)`}
          </p>
        </div>
        <button onClick={() => setStep("account")}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--input)" }}>
          <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Auto-categorization notice */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <i className="fa-solid fa-wand-magic-sparkles text-xs flex-shrink-0" style={{ color: "var(--income)" }} />
        <p className="text-xs" style={{ color: "var(--income)" }}>
          Categorias detectadas automaticamente. Toque no badge colorido de cada linha para corrigir se precisar.
        </p>
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between px-1">
        <button onClick={toggleAll} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          {rows.filter(r => !r.isDupe && !r.shouldExclude).every(r => r.selected) ? "Desmarcar todos" : "Selecionar todos"}
        </button>
        <span className="mono-data text-xs" style={{ color: "var(--muted-foreground)" }}>
          {selectedCount} de {rows.length}
        </span>
      </div>

      {/* Rows */}
      {rows.map(row => {
        const cat = CATEGORIES.find(c => c.id === row.categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
        const isIgnored = row.shouldExclude || row.isDupe;

        return (
          <div key={row.uid}
            className="rounded-2xl p-3 flex flex-col gap-2 transition-all"
            style={{
              background: isIgnored ? "transparent" : row.selected ? "var(--card)" : "transparent",
              border: `1px solid ${row.shouldExclude
                ? "rgba(100,116,139,0.15)"
                : row.isDupe
                  ? "rgba(251,191,36,0.25)"
                  : row.isPossibleDupe && row.selected
                    ? "rgba(251,191,36,0.4)"
                    : row.selected
                      ? "var(--border)"
                      : "rgba(255,255,255,0.04)"}`,
              opacity: isIgnored ? 0.4 : !row.selected ? 0.45 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={() => !isIgnored && toggleRow(row.uid)}
                disabled={isIgnored}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: isIgnored ? "var(--muted)" : row.selected ? "var(--primary)" : "transparent",
                  border: `1px solid ${isIgnored ? "transparent" : row.selected ? "transparent" : "var(--border)"}`,
                }}
              >
                {row.shouldExclude && <i className="fa-solid fa-ban text-[8px]" style={{ color: "var(--muted-foreground)" }} />}
                {row.isDupe && <i className="fa-solid fa-minus text-[8px]" style={{ color: "var(--gold)" }} />}
                {!isIgnored && row.selected && !row.isPossibleDupe && <i className="fa-solid fa-check text-[9px] text-white" />}
                {!isIgnored && row.selected && row.isPossibleDupe && <i className="fa-solid fa-triangle-exclamation text-[9px]" style={{ color: "var(--gold)" }} />}
              </button>

              {/* Category badge — tap to expand picker */}
              <button
                onClick={() => !isIgnored && setExpandedCat(expandedCat === row.uid ? null : row.uid)}
                disabled={isIgnored}
                className="flex items-center gap-1 px-2 py-1 rounded-xl flex-shrink-0 transition-all"
                style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}35` }}
                title="Toque para mudar categoria">
                <i className={`fa-solid ${cat.icon} text-[10px]`} style={{ color: cat.color }} />
                <span className="text-[9px] font-semibold hidden sm:inline" style={{ color: cat.color }}>{cat.name}</span>
                {!isIgnored && <i className="fa-solid fa-chevron-down text-[7px]" style={{ color: cat.color, opacity: 0.7 }} />}
              </button>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-medium truncate max-w-[180px]">{row.description}</p>
                </div>
                <p className="text-[10px] mt-0.5 mono-data" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(row.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  {row.subcategory && <span className="ml-1 capitalize"> · {row.subcategory}</span>}
                  {row.shouldExclude && <span className="ml-1" style={{ color: "var(--muted-foreground)" }}> · pag. fatura (ignorado)</span>}
                  {row.isDupe && <span className="ml-1" style={{ color: "var(--gold)" }}> · já importado</span>}
                  {row.isPossibleDupe && <span className="ml-1" style={{ color: "var(--gold)" }}> · verificar duplicata</span>}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="mono-data text-xs font-semibold"
                  style={{ color: row.type === "income" ? "var(--income)" : "var(--expense)" }}>
                  {row.type === "income" ? "+" : "-"}{BRL(row.amount)}
                </p>
                {!isIgnored && (
                  <button onClick={() => setType(row.uid, row.type === "income" ? "expense" : "income")}
                    className="text-[9px] underline mt-0.5"
                    style={{ color: "var(--muted-foreground)" }}>
                    {row.type === "income" ? "→ saída?" : "→ entrada?"}
                  </button>
                )}
              </div>
            </div>

            {/* Category picker — opens on badge tap */}
            {row.selected && !isIgnored && expandedCat === row.uid && (
              <div className="rounded-xl p-2 mt-0.5"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <p className="text-[9px] font-semibold mb-2 px-1" style={{ color: "var(--muted-foreground)" }}>
                  Escolher categoria
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c.id}
                      onClick={() => { setCat(row.uid, c.id); setExpandedCat(null); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all"
                      style={{
                        background: row.categoryId === c.id ? `${c.color}25` : "var(--card)",
                        border:     `1px solid ${row.categoryId === c.id ? c.color + "70" : "transparent"}`,
                        color:      row.categoryId === c.id ? c.color : "var(--muted-foreground)",
                      }}>
                      <i className={`fa-solid ${c.icon} text-[8px]`} style={{ color: c.color }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Schema warning */}
      {schemaWarning && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <i className="fa-solid fa-triangle-exclamation text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>Salvo sem dados de conta</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Para salvar nome/tipo de conta e recorrências, execute o arquivo
              <span className="mono-data font-semibold" style={{ color: "var(--foreground)" }}> supabase-schema-v2.sql</span> no Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <i className="fa-solid fa-circle-exclamation text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--expense)" }} />
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: "var(--expense)" }}>Erro ao salvar</p>
            <p className="text-[10px] mt-0.5 break-all" style={{ color: "var(--muted-foreground)" }}>{saveError}</p>
          </div>
          <button onClick={() => setSaveError(null)} className="flex-shrink-0">
            <i className="fa-solid fa-xmark text-xs" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      )}

      {/* Confirm button */}
      <div className="sticky bottom-20 py-2 flex flex-col gap-2">
        {pendingFutInst > 0 && (
          <p className="text-center text-xs px-3 py-2 rounded-xl"
            style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)" }}>
            <i className="fa-solid fa-rotate mr-1.5" />
            {pendingFutInst} parcela{pendingFutInst !== 1 ? "s" : ""} futura{pendingFutInst !== 1 ? "s" : ""} serão criadas automaticamente
          </p>
        )}
        <button onClick={handleImport} disabled={saving || selectedCount === 0}
          className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-40">
          {saving
            ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Salvando…</>
            : <><i className="fa-solid fa-piggy-bank mr-2" />Pingar {selectedCount} no porquinho</>}
        </button>
      </div>
    </div>
  );
}
