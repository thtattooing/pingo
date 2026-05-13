"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/* ─── dados ────────────────────────────────────────────────── */

const BANKS = [
  { name: "Nubank",    color: "#820AD1" },
  { name: "C6 Bank",  color: "#9B9B9B" },
  { name: "Inter",    color: "#FF7A00" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Itaú",     color: "#003087" },
  { name: "Santander",color: "#EC0000" },
  { name: "Caixa",    color: "#005B9F" },
  { name: "BB",       color: "#FFCC00" },
];

const PAIN_POINTS = [
  { icon: "fa-face-dizzy",          text: "Chega no dia 20 do mês sem saber o que aconteceu com o salário" },
  { icon: "fa-credit-card",         text: "A fatura do cartão chegou maior do que esperava — de novo" },
  { icon: "fa-table",               text: "Começou uma planilha no Excel, abandonou em dois dias" },
  { icon: "fa-circle-question",     text: "Tem aquelas compras no extrato que você não reconhece" },
  { icon: "fa-hand-holding-dollar", text: "Quer guardar dinheiro mas nunca sobra nada no fim do mês" },
];

const FEATURES = [
  {
    icon: "fa-file-arrow-up",
    color: "#F472B6",
    bg: "rgba(244,114,182,0.12)",
    border: "rgba(244,114,182,0.25)",
    title: "Importação em 10 segundos",
    benefit: "Chega de digitar manualmente",
    desc: "Baixe o extrato CSV ou OFX do app do seu banco e arraste pro PINGO. Nubank, C6, Inter, Bradesco — ele detecta o formato e lê tudo sozinho.",
  },
  {
    icon: "fa-wand-magic-sparkles",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.25)",
    title: "Categorização automática",
    benefit: "Sem configurar nada",
    desc: "\"ASSAI ATACADISTA\" vira Alimentação. \"NETFLIX\" vira Assinatura. \"99\" vira Transporte. Funciona desde o primeiro upload — zero configuração.",
  },
  {
    icon: "fa-credit-card",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    title: "Faturas e parcelas no controle",
    benefit: "Sem susto no fechamento",
    desc: "Cada parcela registrada no mês certo. Veja exatamente o que vai cair na fatura de cada cartão, com ou sem parcelamento.",
  },
  {
    icon: "fa-bullseye",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    title: "Metas que funcionam",
    benefit: "Controle de verdade",
    desc: "Define R$ 500 pra restaurante. Quando chegar em 80% você já sabe. Simples, visual, sem julgamento — só informação.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ana C.",
    role: "Designer, SP",
    text: "Finalmente entendi porque meu dinheiro sumia. Era iFood e parcelas que eu tinha esquecido. O PINGO mostrou tudo numa segunda.",
    stars: 5,
    color: "#F472B6",
  },
  {
    name: "Lucas M.",
    role: "Dev, RJ",
    text: "Importei 6 meses do Nubank de uma vez. Em menos de 2 minutos já tinha gráfico por categoria. Nunca tinha conseguido isso com planilha.",
    stars: 5,
    color: "#FBBF24",
  },
  {
    name: "Mari S.",
    role: "Professora, MG",
    text: "Uso o C6 e o Nubank. O PINGO importou os dois, juntou tudo e mostrou que eu gastava R$800 por mês em delivery. Foi um choque — mas foi útil.",
    stars: 5,
    color: "#A78BFA",
  },
];

const FAQS = [
  {
    q: "É realmente gratuito? O que tem de pegadinha?",
    a: "Sem pegadinha. O PINGO é 100% gratuito. Não tem trial, não tem plano pago, não tem limite de transações. O objetivo é ser útil, simples assim.",
  },
  {
    q: "Meus dados bancários ficam seguros?",
    a: "Você nunca precisa informar senha ou conectar o banco. O fluxo é: você baixa o extrato do app do seu banco e importa aqui. O PINGO não acessa sua conta em nenhum momento.",
  },
  {
    q: "Quais bancos e formatos funcionam?",
    a: "CSV e OFX do Nubank, C6 Bank, Inter, Bradesco, Itaú, Santander, Caixa, Banco do Brasil e mais. Se o seu banco exporta CSV ou OFX, provavelmente funciona.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O PINGO funciona direto no navegador do celular ou computador. Cria uma conta em menos de 1 minuto e já começa.",
  },
  {
    q: "E se a categorização automática errar?",
    a: "Você pode ajustar manualmente. Mas a maioria dos estabelecimentos brasileiros é reconhecida corretamente — Supermercados, iFood, Uber, Netflix, farmácias, contas de luz...",
  },
];

const STEPS = [
  {
    n: "1", icon: "fa-user-plus", color: "#F472B6",
    title: "Crie sua conta grátis",
    desc: "Email ou Google. Menos de 60 segundos. Sem cartão de crédito.",
  },
  {
    n: "2", icon: "fa-file-arrow-up", color: "#FBBF24",
    title: "Importe seu extrato",
    desc: "Baixe o CSV ou OFX no app do banco e arraste aqui. Pronto.",
  },
  {
    n: "3", icon: "fa-chart-pie", color: "#10B981",
    title: "Entenda seus gastos",
    desc: "Veja por categoria, por mês, por cartão. Sem planilha, sem esforço.",
  },
];

/* ─── componentes auxiliares ────────────────────────────────── */

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} className="fa-solid fa-star text-xs" style={{ color: "#FBBF24" }} />
      ))}
    </div>
  );
}

function CtaPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base transition-all active:scale-95 no-underline"
      style={{
        background: "linear-gradient(135deg,#EC4899,#F472B6)",
        color: "#fff",
        boxShadow: "0 8px 32px rgba(236,72,153,0.4)",
      }}>
      {children}
    </Link>
  );
}

function SectionLabel({ color = "var(--primary)", children }: { color?: string; children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>{children}</p>
  );
}

/* ─── página principal ──────────────────────────────────────── */

export default function LandingClient() {
  const [scrolled, setScrolled]     = useState(false);
  const [openFaq, setOpenFaq]       = useState<number | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(16,10,24,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(244,114,182,0.12)" : "none",
        }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", boxShadow: "0 0 14px rgba(244,114,182,0.45)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-sm" />
            </div>
            <span className="text-lg font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>PINGO</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-xl transition-all no-underline"
              style={{ color: "var(--muted-foreground)" }}>
              Entrar
            </Link>
            <Link href="/login?tab=signup"
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 no-underline"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", color: "#fff", boxShadow: "0 4px 16px rgba(236,72,153,0.35)" }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO — ATENÇÃO ═══════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-32 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%,rgba(236,72,153,0.3) 0%,rgba(251,191,36,0.05) 55%,transparent 100%)" }} />

        {/* mascote */}
        <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-coin-drop"
            style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: "linear-gradient(135deg,#D97706,#FBBF24)", color: "#100A18", boxShadow: "0 4px 16px rgba(251,191,36,0.7)" }}>
              R$
            </div>
          </div>
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center animate-gold-shine"
            style={{ background: "linear-gradient(135deg,#EC4899 0%,#F9A8D4 50%,#F472B6 100%)", boxShadow: "0 0 60px rgba(244,114,182,0.5)" }}>
            <i className="fa-solid fa-piggy-bank text-5xl text-white drop-shadow-lg" />
          </div>
        </div>

        {/* badge de prova social imediata */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold animate-fade-in-up"
          style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.3)", color: "var(--primary)", animationDelay: "0.15s", animationFillMode: "both" }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--primary)" }} />
          100% gratuito · sem cartão · sem limite
        </div>

        {/* headline — DOR transformada em PROMESSA */}
        <h1 className="text-4xl md:text-6xl font-normal leading-tight max-w-3xl mb-6 animate-fade-in-up"
          style={{ fontFamily: "var(--font-calistoga)", animationDelay: "0.2s", animationFillMode: "both" }}>
          Descubra para onde vai<br />
          <span style={{ color: "var(--primary)" }}>cada centavo do seu dinheiro.</span>
        </h1>

        {/* sub — proposta de valor clara */}
        <p className="text-lg max-w-xl mb-4 leading-relaxed animate-fade-in-up"
          style={{ color: "var(--muted-foreground)", animationDelay: "0.28s", animationFillMode: "both" }}>
          Importe o extrato do seu banco. O PINGO categoriza tudo automaticamente
          e mostra o panorama completo dos seus gastos — em segundos, sem planilha.
        </p>
        <p className="text-sm mb-10 font-medium animate-fade-in-up"
          style={{ color: "var(--primary)", animationDelay: "0.32s", animationFillMode: "both" }}>
          Funciona com Nubank, C6, Inter, Bradesco, Itaú e mais.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "0.38s", animationFillMode: "both" }}>
          <CtaPrimary href="/login?tab=signup">
            <i className="fa-solid fa-piggy-bank" />
            Criar conta grátis agora
          </CtaPrimary>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all active:scale-95 no-underline"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--foreground)" }}>
            Já tenho conta →
          </Link>
        </div>

        {/* estrelas + social proof mini */}
        <div className="flex flex-col items-center gap-2 mt-8 animate-fade-in-up"
          style={{ animationDelay: "0.44s", animationFillMode: "both" }}>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <i key={i} className="fa-solid fa-star text-sm" style={{ color: "#FBBF24" }} />)}
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Avaliado 5 estrelas por quem finalmente entendeu seus gastos
          </p>
        </div>

        {/* bancos */}
        <div className="mt-14 animate-fade-in-up" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
          <p className="text-xs mb-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
            Compatível com os principais bancos do Brasil
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {BANKS.map(b => (
              <span key={b.name} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${b.color}15`, border: `1px solid ${b.color}30`, color: b.color }}>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DOR — PROBLEMA / RAPPORT ═════════════════════════════ */}
      <section className="px-5 py-16" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Você se identifica com algum desses?</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-normal leading-snug"
              style={{ fontFamily: "var(--font-calistoga)" }}>
              A maioria das pessoas não sabe<br />
              <span style={{ color: "var(--expense)" }}>para onde vai seu próprio dinheiro.</span>
            </h2>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              E não é falta de esforço. É que controlar finanças do jeito tradicional é chato,
              complicado e nunca cola. Você já tentou planilha, né?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <i className={`fa-solid ${p.icon} text-base`} style={{ color: "var(--expense)" }} />
                </div>
                <p className="text-sm leading-snug">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-2xl text-center"
            style={{ background: "rgba(244,114,182,0.07)", border: "1px solid rgba(244,114,182,0.2)" }}>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--primary)" }}>
              Se você marcou qualquer um desses, o PINGO é pra você.
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              E a solução é mais simples do que parece.
            </p>
          </div>
        </div>
      </section>

      {/* ══ SOLUÇÃO — INTERESSE / DESEJO ═════════════════════════ */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <SectionLabel>A solução</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-normal leading-snug"
            style={{ fontFamily: "var(--font-calistoga)" }}>
            Tudo que você precisa saber<br />
            <span style={{ color: "var(--primary)" }}>sem precisar fazer nada complicado.</span>
          </h2>
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            O PINGO não te pede pra mudar hábitos, categorizar na mão ou conectar sua conta bancária.
            Você importa o extrato — o resto é com ele.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="rounded-2xl p-6 flex flex-col gap-4 transition-all"
              style={{ background: "var(--card)", border: `1px solid ${f.border}` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: f.bg }}>
                  <i className={`fa-solid ${f.icon} text-xl`} style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: f.color }}>{f.benefit}</p>
                  <h3 className="font-bold text-base">{f.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ COMO FUNCIONA ════════════════════════════════════════ */}
      <section className="px-5 py-20" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel color="var(--gold)">Como funciona</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
              Do zero ao controle total<br />
              <span style={{ color: "var(--gold)" }}>em menos de 5 minutos.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-5 relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] right-[-40%] h-px"
                    style={{ background: `linear-gradient(to right, ${s.color}50, transparent)` }} />
                )}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                  style={{ background: `${s.color}15`, border: `2px solid ${s.color}35` }}>
                  <i className={`fa-solid ${s.icon} text-3xl`} style={{ color: s.color }} />
                  <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ background: s.color, color: "#100A18" }}>{s.n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <CtaPrimary href="/login?tab=signup">
              <i className="fa-solid fa-rocket" />
              Começar agora — é grátis
            </CtaPrimary>
          </div>
        </div>
      </section>

      {/* ══ NÚMEROS / PROVA SOCIAL ════════════════════════════════ */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "100%",    label: "Gratuito para sempre",  icon: "fa-gift",             color: "#F472B6" },
            { value: "10+",     label: "Bancos compatíveis",    icon: "fa-building-columns",  color: "#FBBF24" },
            { value: "0",       label: "Acesso à sua conta",    icon: "fa-shield-halved",     color: "#10B981" },
            { value: "< 1min",  label: "Para criar conta",      icon: "fa-bolt",              color: "#A78BFA" },
          ].map(item => (
            <div key={item.label} className="rounded-2xl py-7 px-4 flex flex-col items-center gap-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}15` }}>
                <i className={`fa-solid ${item.icon} text-xl`} style={{ color: item.color }} />
              </div>
              <p className="text-2xl font-black" style={{ fontFamily: "var(--font-calistoga)", color: item.color }}>{item.value}</p>
              <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ DEPOIMENTOS ══════════════════════════════════════════ */}
      <section className="px-5 py-20" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel color="#A78BFA">Quem usa, aprova</SectionLabel>
            <h2 className="text-3xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
              Pessoas reais, resultados reais.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "var(--background)", border: `1px solid ${t.color}25` }}>
                <StarRow n={t.stars} />
                <p className="text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: `${t.color}20`, color: t.color }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ / OBJEÇÕES ════════════════════════════════════════ */}
      <section className="px-5 py-20 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel color="var(--gold)">Dúvidas frequentes</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>
            Respondendo antes<br />que você pergunte.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all"
              style={{ background: "var(--card)", border: `1px solid ${openFaq === i ? "rgba(244,114,182,0.35)" : "var(--border)"}` }}>
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="text-sm font-semibold">{faq.q}</span>
                <i className={`fa-solid fa-chevron-down text-xs flex-shrink-0 transition-transform duration-200`}
                  style={{ color: "var(--primary)", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <div className="h-px w-full mb-4" style={{ background: "var(--border)" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA FINAL — AÇÃO ══════════════════════════════════════ */}
      <section className="px-5 py-24 relative overflow-hidden"
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%,rgba(236,72,153,0.18) 0%,transparent 70%)" }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", boxShadow: "0 0 40px rgba(244,114,182,0.4)" }}>
            <i className="fa-solid fa-piggy-bank text-4xl text-white" />
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-normal leading-tight"
              style={{ fontFamily: "var(--font-calistoga)" }}>
              Chega de se perguntar<br />
              <span style={{ color: "var(--primary)" }}>"para onde foi meu dinheiro?"</span>
            </h2>
            <p className="text-base mt-4 max-w-lg mx-auto" style={{ color: "var(--muted-foreground)" }}>
              Em menos de 5 minutos você vai ter clareza total sobre seus gastos.
              Grátis, sem conectar o banco, sem burocracia.
            </p>
          </div>

          <CtaPrimary href="/login?tab=signup">
            <i className="fa-solid fa-piggy-bank" />
            Quero controlar meu dinheiro agora
          </CtaPrimary>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
            style={{ color: "var(--muted-foreground)" }}>
            <span><i className="fa-solid fa-check mr-1.5" style={{ color: "var(--income)" }} />Grátis para sempre</span>
            <span><i className="fa-solid fa-check mr-1.5" style={{ color: "var(--income)" }} />Sem cartão de crédito</span>
            <span><i className="fa-solid fa-check mr-1.5" style={{ color: "var(--income)" }} />Sem conectar o banco</span>
            <span><i className="fa-solid fa-check mr-1.5" style={{ color: "var(--income)" }} />Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="px-5 py-10" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)" }}>
              <i className="fa-solid fa-piggy-bank text-white text-xs" />
            </div>
            <span className="font-normal" style={{ fontFamily: "var(--font-calistoga)" }}>PINGO</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· Cada pingo conta 🐷</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/login" className="no-underline hover:text-white transition-colors">Entrar</Link>
            <Link href="/login?tab=signup" className="no-underline hover:text-white transition-colors">Criar conta</Link>
            <span>© 2026 PINGO</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
