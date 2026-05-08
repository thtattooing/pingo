import Anthropic from "@anthropic-ai/sdk";

export interface AnalyzeInput {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export interface AnalyzeResult {
  id: string;
  category: string;
  subcategory: string;
  isRecurring: boolean;
  shouldExclude: boolean;
}

const VALID_CATEGORIES = [
  "alimentacao","transporte","moradia","saude","educacao","lazer",
  "assinaturas","energia","agua","vestuario","salario","freelance",
  "investimento","outros",
];

const SYSTEM_PROMPT = `Você é um especialista em finanças pessoais brasileiras.
Classifique cada transação bancária e retorne um JSON array.

Regras importantes:
- shouldExclude = true para: pagamento/débito de fatura de cartão, transferência entre contas próprias, estorno, IOF sobre fatura
- isRecurring = true para: assinaturas (Netflix, Spotify, Disney, Prime, Apple, Google), contas mensais (internet, energia, água, aluguel, academia, celular), qualquer cobrança recorrente previsível
- category deve ser uma das categorias válidas fornecidas
- subcategory: rótulo curto em português (ex: "streaming", "combustível", "academia", "supermercado", "farmácia")

Responda APENAS com JSON array. Sem markdown. Sem explicação.`;

function buildPrompt(transactions: AnalyzeInput[], categories: string[]): string {
  return `Categorias válidas: ${categories.join(", ")}

Transações para classificar:
${transactions.map(t =>
  `{"id":"${t.id}","desc":"${t.description}","valor":${t.amount},"tipo":"${t.type}"}`
).join("\n")}

Retorne um array JSON onde cada objeto tem: id, category, subcategory, isRecurring (boolean), shouldExclude (boolean).`;
}

function safeParse(text: string): AnalyzeResult[] {
  const clean = text
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/\s*```$/im, "")
    .trim();
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try extracting JSON array from anywhere in the text
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return [];
  }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ results: [], error: "no_key" }, { status: 200 });
  }

  let body: { transactions: AnalyzeInput[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ results: [], error: "invalid_body" }, { status: 400 });
  }

  const { transactions } = body;
  if (!transactions?.length) {
    return Response.json({ results: [] });
  }

  // Process in batches of 80
  const BATCH = 80;
  const allResults: AnalyzeResult[] = [];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (let i = 0; i < transactions.length; i += BATCH) {
    const batch = transactions.slice(i, i + BATCH);
    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(batch, VALID_CATEGORIES) }],
      });

      const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
      const results = safeParse(text);

      // Validate and normalize each result
      results.forEach(r => {
        if (!r.id) return;
        allResults.push({
          id:           r.id,
          category:     VALID_CATEGORIES.includes(r.category) ? r.category : "outros",
          subcategory:  r.subcategory ?? "",
          isRecurring:  Boolean(r.isRecurring),
          shouldExclude: Boolean(r.shouldExclude),
        });
      });
    } catch (err) {
      console.error("Analyze batch error:", err);
      // Continue with remaining batches even if one fails
    }
  }

  return Response.json({ results: allResults });
}
