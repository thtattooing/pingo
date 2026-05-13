"use client";

import { useState, useRef, useEffect } from "react";
import { BRL } from "@/lib/formatters";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Como estão meus gastos este mês?",
  "Em que estou gastando mais?",
  "Como economizar mais?",
  "Devo me preocupar com meu saldo?",
];

export default function ChatClient({
  income,
  expense,
  topCategory,
}: {
  income: number;
  expense: number;
  topCategory: string;
}) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `Oi! Sou o assistente do PINGO 🐷\n\nVi que você teve **${BRL(income)}** de entradas e **${BRL(expense)}** de saídas recentemente. O maior gasto foi em **${topCategory}**.\n\nComo posso te ajudar com suas finanças?`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Desculpe, ocorreu um erro." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" }}>
                <i className="fa-solid fa-piggy-bank text-white text-xs" />
              </div>
            )}
            <div
              className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === "user" ? {
                background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
                color: "#fff",
                borderBottomRightRadius: 4,
              } : {
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                borderBottomLeftRadius: 4,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
              style={{ background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-xs" />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "var(--primary)", animationDelay: `${j * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-xl whitespace-nowrap"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-4 flex gap-3 items-end">
        <div className="flex-1 rounded-2xl flex items-end gap-2 px-4 py-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Pergunte sobre suas finanças..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm"
            style={{ color: "var(--foreground)", maxHeight: 100 }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 btn-primary disabled:opacity-40"
        >
          <i className="fa-solid fa-paper-plane text-sm" />
        </button>
      </div>
    </div>
  );
}
