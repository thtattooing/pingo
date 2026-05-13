"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Stage = "loading" | "form" | "success" | "expired";

export default function RedefinirSenhaPage() {
  const [stage, setStage]       = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user follows the reset link
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStage("form");
    });

    // Give it a moment; if no recovery event, check if already has session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStage("form");
      else setTimeout(() => setStage(s => s === "loading" ? "expired" : s), 3000);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setStage("success");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(236,72,153,0.15) 0%,transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8 animate-fade-in-up">

        {/* Loading */}
        {stage === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <i className="fa-solid fa-spinner fa-spin text-3xl" style={{ color: "var(--primary)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Verificando link de redefinição…</p>
          </div>
        )}

        {/* Expired / invalid */}
        {stage === "expired" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center card-pingo">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <i className="fa-solid fa-link-slash text-2xl" style={{ color: "var(--expense)" }} />
            </div>
            <div>
              <h2 className="font-semibold mb-2">Link expirado ou inválido</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Este link de redefinição expirou. Solicite um novo link.
              </p>
            </div>
            <Link href="/esqueci-senha"
              className="w-full py-3 rounded-2xl font-semibold text-sm btn-primary text-center no-underline">
              Solicitar novo link
            </Link>
          </div>
        )}

        {/* Form */}
        {stage === "form" && (
          <>
            <div className="flex flex-col gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.25)" }}>
                <i className="fa-solid fa-key text-2xl" style={{ color: "var(--primary)" }} />
              </div>
              <h1 className="text-2xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
                Nova senha
              </h1>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Escolha uma senha forte com pelo menos 6 caracteres.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card-pingo flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Nova senha</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required minLength={6} autoFocus
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
                    <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"} text-xs`}
                      style={{ color: "var(--muted-foreground)" }} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Confirmar nova senha</label>
                <input type={showPass ? "text" : "password"}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha" required minLength={6} autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--input)",
                    border: `1px solid ${confirm && confirm !== password ? "var(--expense)" : "var(--border)"}`,
                    color: "var(--foreground)",
                  }} />
                {confirm && confirm !== password && (
                  <p className="text-[11px]" style={{ color: "var(--expense)" }}>As senhas não coincidem</p>
                )}
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{
                          background: i <= Math.min(4, Math.floor(password.length / 3) + (password.match(/[^a-z0-9]/i) ? 1 : 0))
                            ? (password.length >= 10 ? "var(--income)" : password.length >= 7 ? "var(--gold)" : "var(--expense)")
                            : "var(--muted)",
                        }} />
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {password.length < 6 ? "Muito curta" : password.length < 8 ? "Razoável" : password.length < 10 ? "Boa" : "Muito forte"}
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                  <i className="fa-solid fa-circle-exclamation text-xs" style={{ color: "var(--expense)" }} />
                  <p className="text-xs" style={{ color: "var(--expense)" }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || password !== confirm || password.length < 6}
                className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-50">
                {loading
                  ? <i className="fa-solid fa-spinner fa-spin" />
                  : <><i className="fa-solid fa-shield-check mr-2" />Salvar nova senha</>}
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {stage === "success" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center card-pingo animate-fade-in-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center animate-coin-drop"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", boxShadow: "0 0 30px rgba(244,114,182,0.4)" }}>
              <i className="fa-solid fa-check text-3xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-normal mb-2" style={{ fontFamily: "var(--font-calistoga)" }}>
                Senha redefinida!
              </h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Sua senha foi atualizada com sucesso. Pode entrar na sua conta.
              </p>
            </div>
            <Link href="/home" className="w-full py-4 rounded-2xl font-semibold text-sm btn-primary text-center no-underline">
              <i className="fa-solid fa-piggy-bank mr-2" />
              Ir para o PINGO
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
