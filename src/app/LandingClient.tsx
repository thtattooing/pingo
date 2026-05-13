"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const BANKS = [
  { name: "Nubank",    color: "#820AD1" },
  { name: "C6 Bank",  color: "#242424" },
  { name: "Inter",    color: "#FF7A00" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Itaú",     color: "#003087" },
  { name: "Santander",color: "#EC0000" },
];

const FEATURES = [
  {
    icon: "fa-file-arrow-up",
    color: "#F472B6",
    bg: "rgba(244,114,182,0.12)",
    title: "Importação em segundos",
    desc: "Arraste o CSV ou OFX do seu banco. Nubank, C6, Inter, Bradesco. O PINGO detecta o formato e lê tudo sozinho.",
  },
  {
    icon: "fa-tags",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.12)",
    title: "Categorização automática",
    desc: "\"ASSAI ATACADISTA\" vira Alimentação. \"NETFLIX\" vira Assinatura. Sem configurar nada — funciona desde o primeiro upload.",
  },
  {
    icon: "fa-credit-card",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    title: "Faturas e parcelas",
    desc: "Cada parcela no lugar certo. Veja exatamente o que entra no próximo boleto do cartão, mês a mês.",
  },
  {
    icon: "fa-bullseye",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    title: "Metas mensais",
    desc: "Defina R$500 para restaurantes. Receba alerta quando chegar em 80%. Simples, visual, eficiente.",
  },
];

const STEPS = [
  { n: "1", icon: "fa-user-plus",      color: "#F472B6", title: "Crie sua conta",       desc: "Menos de 1 minuto. Com email ou Google." },
  { n: "2", icon: "fa-file-arrow-up",  color: "#FBBF24", title: "Importe seu extrato",  desc: "CSV ou OFX direto do app do seu banco." },
  { n: "3", icon: "fa-chart-pie",      color: "#10B981", title: "Entenda seus gastos",  desc: "Gráficos, categorias e alertas automáticos." },
];

export default function LandingClient() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── STICKY NAV ─────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(16,10,24,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(244,114,182,0.12)" : "none",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", boxShadow: "0 0 12px rgba(244,114,182,0.4)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-sm" />
            </div>
            <span className="text-lg font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>PINGO</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
              style={{ color: "var(--muted-foreground)" }}>
              Entrar
            </Link>
            <Link href="/login?tab=signup"
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", color: "#fff" }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-32 pb-20 text-center overflow-hidden">
        {/* glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 55% at 50% -5%,rgba(236,72,153,0.28) 0%,rgba(251,191,36,0.06) 60%,transparent 100%)" }} />

        {/* moeda caindo */}
        <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-coin-drop"
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#D97706,#FBBF24)", color: "#100A18", boxShadow: "0 2px 12px rgba(251,191,36,0.6)" }}>
              R$
            </div>
          </div>
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl animate-gold-shine"
            style={{ background: "linear-gradient(135deg,#EC4899 0%,#F9A8D4 50%,#F472B6 100%)", boxShadow: "0 0 50px rgba(244,114,182,0.45)" }}>
            <i className="fa-solid fa-piggy-bank text-5xl text-white drop-shadow" />
          </div>
        </div>

        {/* badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium animate-fade-in-up"
          style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.25)", color: "var(--primary)", animationDelay: "0.15s" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--primary)" }} />
          Controle financeiro pessoal · 100% privado
        </div>

        {/* headline */}
        <h1 className="text-4xl md:text-6xl font-normal leading-tight max-w-3xl mb-5 animate-fade-in-up"
          style={{ fontFamily: "var(--font-calistoga)", animationDelay: "0.2s" }}>
          Cada pingo que sai,<br />
          <span style={{ color: "var(--primary)" }}>você sabe para onde foi.</span>
        </h1>

        <p className="text-base md:text-lg max-w-xl mb-8 leading-relaxed animate-fade-in-up"
          style={{ color: "var(--muted-foreground)", animationDelay: "0.3s" }}>
          Importe extratos do Nubank, C6 e Inter. O PINGO categoriza tudo automaticamente
          e mostra onde seu dinheiro está indo — sem planilhas, sem complicação.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <Link href="/login?tab=signup"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", color: "#fff", boxShadow: "0 8px 30px rgba(236,72,153,0.35)" }}>
            <i className="fa-solid fa-piggy-bank" />
            Começar grátis
          </Link>
          <Link href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-medium text-base transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--foreground)" }}>
            Já tenho conta →
          </Link>
        </div>

        {/* banks strip */}
        <div className="mt-14 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            Funciona com os principais bancos do Brasil
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {BANKS.map(b => (
              <span key={b.name}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${b.color}18`, border: `1px solid ${b.color}35`, color: b.color }}>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>Funcionalidades</p>
          <h2 className="text-2xl md:text-3xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Tudo que você precisa,<br />nada que você não quer.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className="rounded-2xl p-6 flex flex-col gap-4 transition-all animate-fade-in-up"
              style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: `${0.1 * i}s` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: f.bg }}>
                <i className={`fa-solid ${f.icon} text-xl`} style={{ color: f.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="px-5 py-16" style={{ background: "var(--card)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>Como funciona</p>
            <h2 className="text-2xl md:text-3xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
              Em 3 passos você já tem<br />controle total.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-4 relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[-50%] h-px"
                    style={{ background: "linear-gradient(to right, rgba(244,114,182,0.3), transparent)" }} />
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                  style={{ background: `${s.color}18`, border: `1.5px solid ${s.color}35` }}>
                  <i className={`fa-solid ${s.icon} text-2xl`} style={{ color: s.color }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: s.color, color: "#100A18" }}>{s.n}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTAQUES ────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "100%",    label: "Gratuito",       icon: "fa-gift",          color: "#F472B6" },
            { value: "10+",     label: "Bancos suportados", icon: "fa-building-columns", color: "#FBBF24" },
            { value: "CSV/OFX", label: "Formatos aceitos",  icon: "fa-file-import",  color: "#A78BFA" },
            { value: "🔒",      label: "Dados privados",    icon: "fa-shield-halved", color: "#10B981" },
          ].map(item => (
            <div key={item.label} className="rounded-2xl py-6 px-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <i className={`fa-solid ${item.icon} text-2xl mb-3 block`} style={{ color: item.color }} />
              <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: "var(--font-calistoga)", color: item.color }}>{item.value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE ────────────────────────────────────────────── */}
      <section className="px-5 py-16" style={{ background: "var(--card)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", boxShadow: "0 0 30px rgba(244,114,182,0.3)" }}>
            <i className="fa-solid fa-piggy-bank text-3xl text-white" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-normal leading-snug mb-4"
            style={{ fontFamily: "var(--font-calistoga)" }}>
            "Chega de se perguntar para onde foi o dinheiro."
          </blockquote>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            O PINGO mostra cada centavo — por categoria, por cartão, por mês. Simples assim.
          </p>
          <Link href="/login?tab=signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", color: "#fff", boxShadow: "0 8px 30px rgba(236,72,153,0.35)" }}>
            <i className="fa-solid fa-piggy-bank" />
            Começar com o PINGO — é grátis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-5 py-10" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-xs" />
            </div>
            <span className="font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>PINGO</span>
            <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>Cada pingo conta 🐷</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/login?tab=signup" className="hover:text-white transition-colors">Criar conta</Link>
            <span>© 2026 PINGO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
