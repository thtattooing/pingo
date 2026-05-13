"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(251,191,36,0.15) 0%,transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8 animate-fade-in-up">

        {/* Back */}
        <Link href="/login" className="flex items-center gap-2 text-sm no-underline w-fit"
          style={{ color: "var(--muted-foreground)" }}>
          <i className="fa-solid fa-arrow-left text-xs" />
          Voltar para o login
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <i className="fa-solid fa-lock-open text-2xl" style={{ color: "var(--gold)" }} />
          </div>
          <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Esqueceu a senha?
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Sem problema. Informe seu email e enviaremos um link para você criar uma nova senha.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="card-pingo flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Seu email de cadastro</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <i className="fa-solid fa-circle-exclamation text-xs" style={{ color: "var(--expense)" }} />
                <p className="text-xs" style={{ color: "var(--expense)" }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-60">
              {loading
                ? <i className="fa-solid fa-spinner fa-spin" />
                : <><i className="fa-solid fa-paper-plane mr-2" />Enviar link de redefinição</>}
            </button>
          </form>
        ) : (
          <div className="card-pingo flex flex-col gap-4 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <i className="fa-solid fa-envelope-circle-check text-2xl" style={{ color: "var(--income)" }} />
            </div>
            <div>
              <h2 className="font-semibold mb-1">Email enviado!</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Enviamos um link de redefinição para <strong style={{ color: "var(--foreground)" }}>{email}</strong>.
                Verifique sua caixa de entrada (e o spam).
              </p>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              O link expira em 1 hora.
            </p>
            <button onClick={() => setSent(false)}
              className="text-xs underline" style={{ color: "var(--muted-foreground)" }}>
              Tentar outro email
            </button>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          Lembrou a senha?{" "}
          <Link href="/login" className="no-underline font-medium" style={{ color: "var(--primary)" }}>Entrar</Link>
        </p>
      </div>
    </main>
  );
}
