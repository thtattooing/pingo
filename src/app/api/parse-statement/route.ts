import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

interface StatementRow {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ rows: [], error: "no_key" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ rows: [], error: "unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text?: string };
  if (!text?.trim()) return Response.json({ rows: [] });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today  = new Date().toISOString().split("T")[0];

  try {
    const msg = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Extraia TODAS as transações do extrato bancário abaixo. Data atual: ${today}.

Para cada transação retorne JSON com:
- date: "YYYY-MM-DD" (se apenas dia/mês visível, use o ano atual)
- description: texto curto da transação
- amount: valor numérico positivo
- type: "income" ou "expense"

Regras:
- "income" = entradas, créditos, depósitos, PIX recebido, salário, transferência recebida
- "expense" = saídas, débitos, pagamentos, PIX enviado, compras, transferência enviada
- Ignore linhas de saldo, cabeçalhos e rodapés
- Valores com vírgula decimal (ex: 1.234,56) → converta para número

Responda APENAS com array JSON. Sem markdown. Sem texto extra.

Extrato:
${text.slice(0, 5000)}`,
      }],
    });

    const raw   = msg.content[0].type === "text" ? msg.content[0].text : "[]";
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    const rows: StatementRow[] = match ? JSON.parse(match[0]) : [];

    const valid = rows.filter(r =>
      typeof r.date === "string" &&
      typeof r.amount === "number" && r.amount > 0 &&
      (r.type === "income" || r.type === "expense")
    );

    return Response.json({ rows: valid });
  } catch (err) {
    console.error("parse-statement:", err);
    return Response.json({ rows: [], error: "parse_error" });
  }
}
