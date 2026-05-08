"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

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
      {/* Fundo com gradiente radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,64,175,0.35) 0%, transparent 70%)",
        }}
      />

      {/* Logo e nome */}
      <div className="relative z-10 flex flex-col items-center gap-6 mb-12 animate-fade-in-up">
        <div className="w-20 h-20 rounded-3xl btn-primary flex items-center justify-center shadow-2xl">
          <span className="text-4xl">💧</span>
        </div>
        <div className="text-center">
          <h1
            className="text-5xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-calistoga)" }}
          >
            PINGO
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2 text-base">
            Cada pingo conta
          </p>
        </div>
      </div>

      {/* Card de login */}
      <div
        className="relative z-10 w-full max-w-sm card-pingo flex flex-col gap-6 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold">Bem-vindo</h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            Entre para gerenciar suas finanças
          </p>
        </div>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin text-lg" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continuar com Google
            </>
          )}
        </button>

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Seus dados são privados e seguros.
          <br />
          Nunca solicitamos senhas bancárias.
        </p>
      </div>
    </main>
  );
}
