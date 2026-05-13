import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history = [] } = await req.json();

  // Fetch last 60 days of transactions for context
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const { data: txRows } = await supabase
    .from("transactions")
    .select("description,amount,type,category_id,date,account_name")
    .eq("user_id", user.id)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: false })
    .limit(100);

  const income  = (txRows ?? []).filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = (txRows ?? []).filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const catMap = new Map<string, number>();
  (txRows ?? []).filter(t => t.type === "expense").forEach(t => {
    const k = t.category_id ?? "outros";
    catMap.set(k, (catMap.get(k) ?? 0) + Number(t.amount));
  });
  const topCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([cat, val]) => `${cat}: R$${val.toFixed(2)}`).join(", ");

  const systemPrompt = `Você é o assistente financeiro do PINGO, app de finanças pessoais brasileiro. Seja direto, amigável e use português informal.

Contexto financeiro dos últimos 60 dias do usuário:
- Entradas totais: R$${income.toFixed(2)}
- Saídas totais: R$${expense.toFixed(2)}
- Saldo: R$${(income - expense).toFixed(2)}
- Top categorias de gasto: ${topCats || "sem dados"}

Responda perguntas sobre as finanças, dê sugestões de economia, analise padrões de gasto, explique conceitos financeiros. Seja conciso (máx 3 parágrafos). Não use markdown excessivo.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    ...history.slice(-8),
    { role: "user", content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
