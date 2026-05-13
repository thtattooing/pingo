"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "signup";

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode]         = useState<Mode>(() =>
    searchParams.get("tab") === "signup" ? "signup" : "login"
  );
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") === "signup") setMode("signup");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || email.split("@")[0] } },
      });
      if (error) setError(error.message);
      else setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Email ou senha incorretos.");
      else window.location.href = "/home";
    }
    setLoading(false);
  }

  async function loginWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(236,72,153,0.22) 0%,rgba(251,191,36,0.04) 60%,transparent 100%)" }} />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-4 mb-10 animate-fade-in-up">
        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-coin-drop"
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#D97706,#FBBF24)", color: "#100A18", boxShadow: "0 2px 8px rgba(251,191,36,0.5)" }}>
              R$
            </div>
          </div>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl animate-gold-shine"
            style={{ background: "linear-gradient(135deg,#EC4899 0%,#F9A8D4 50%,#F472B6 100%)", boxShadow: "0 0 40px rgba(244,114,182,0.4)" }}>
            <i className="fa-solid fa-piggy-bank text-4xl text-white drop-shadow" />
          </div>
        </div>
        <div className="text-center">
          <Link href="/" className="no-underline">
            <h1 className="text-5xl font-normal tracking-tight"
              style={{ fontFamily: "var(--font-calistoga)", color: "var(--foreground)" }}>PINGO</h1>
          </Link>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Cada pingo conta 🐷</p>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm card-pingo flex flex-col gap-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--muted)" }}>
          {(["login", "signup"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={{ background: mode === m ? "var(--primary)" : "transparent", color: mode === m ? "#fff" : "var(--muted-foreground)", borderRadius: "0.6rem" }}>
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Como quer ser chamado?</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome" autoComplete="name"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Senha</label>
              {mode === "login" && (
                <Link href="/esqueci-senha" className="text-xs no-underline hover:underline"
                  style={{ color: "var(--primary)" }}>
                  Esqueci minha senha
                </Link>
              )}
            </div>
            <div className="relative">
              <input type={showPass ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                required minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
                <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"} text-xs`}
                  style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl animate-fade-in-up"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <i className="fa-solid fa-circle-exclamation text-xs" style={{ color: "var(--expense)" }} />
              <p className="text-xs" style={{ color: "var(--expense)" }}>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl animate-fade-in-up"
              style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)" }}>
              <i className="fa-solid fa-circle-check text-xs" style={{ color: "var(--income)" }} />
              <p className="text-xs" style={{ color: "var(--income)" }}>{success}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary mt-1 disabled:opacity-60">
            {loading
              ? <i className="fa-solid fa-spinner fa-spin" />
              : mode === "login" ? "Entrar na minha conta" : "Criar minha conta grátis"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>ou continue com</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <button onClick={loginWithGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-medium text-sm transition-all active:scale-95 disabled:opacity-60"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuar com Google
        </button>

        <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          Seus dados são privados e não são compartilhados.
        </p>
      </div>

      <Link href="/" className="relative z-10 mt-6 text-xs no-underline flex items-center gap-1.5 animate-fade-in-up"
        style={{ color: "var(--muted-foreground)", animationDelay: "0.2s" }}>
        <i className="fa-solid fa-arrow-left text-[10px]" />
        Voltar para o início
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
