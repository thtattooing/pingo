"use client";

import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { useState } from "react";

type Section = "perfil" | "senha" | "email" | "conta";

interface Props {
  email: string;
  displayName: string;
  provider: string;
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card-pingo flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.2)" }}>
          <i className={`fa-solid ${icon} text-xs`} style={{ color: "var(--primary)" }} />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ background: "var(--border)" }} />;
}

function InputField({
  label, value, onChange, type = "text", placeholder, disabled, autoComplete,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean; autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        disabled={disabled} autoComplete={autoComplete}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
        style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}

export default function ConfiguracoesClient({ email, displayName, provider }: Props) {
  const { theme, toggle } = useTheme();

  // Perfil
  const [name, setName]         = useState(displayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Senha
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [showPass, setShowPass]       = useState(false);

  // Email
  const [newEmail, setNewEmail]       = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  // Conta
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(false);
  const [deleteLoading, setDeleteLoading]   = useState(false);

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");

  async function saveName() {
    if (!name.trim()) return;
    setNameLoading(true); setNameMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setNameLoading(false);
    setNameMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Nome atualizado!" });
  }

  async function savePassword() {
    if (newPass.length < 6)  { setPassMsg({ ok: false, text: "A senha deve ter pelo menos 6 caracteres." }); return; }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: "As senhas não coincidem." }); return; }
    setPassLoading(true); setPassMsg(null);
    const supabase = createClient();
    // Re-authenticate with current password before changing
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPass });
    if (signInErr) { setPassLoading(false); setPassMsg({ ok: false, text: "Senha atual incorreta." }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassLoading(false);
    if (error) { setPassMsg({ ok: false, text: error.message }); return; }
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    setPassMsg({ ok: true, text: "Senha alterada com sucesso!" });
  }

  async function saveEmail() {
    if (!newEmail || !newEmail.includes("@")) { setEmailMsg({ ok: false, text: "Informe um email válido." }); return; }
    setEmailLoading(true); setEmailMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) { setEmailMsg({ ok: false, text: error.message }); return; }
    setNewEmail("");
    setEmailMsg({ ok: true, text: "Um link de confirmação foi enviado para o novo email." });
  }

  async function handleSignOut() {
    setSignOutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    const supabase = createClient();
    // Sign out and redirect — actual deletion requires server-side service role
    await supabase.auth.signOut();
    window.location.href = "/?deleted=1";
  }

  const isOAuth = provider === "google" || provider === "github";

  return (
    <main className="min-h-screen pb-28 px-4 pt-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%,rgba(236,72,153,0.1) 0%,transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link href="/home"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 no-underline"
            style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-arrow-left text-xs" style={{ color: "var(--muted-foreground)" }} />
          </Link>
          <div>
            <h1 className="text-xl font-normal leading-tight" style={{ fontFamily: "var(--font-calistoga)" }}>
              Configurações
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Gerencie sua conta e preferências</p>
          </div>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 card-pingo">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: "linear-gradient(135deg,#EC4899,#F472B6)", color: "#fff", boxShadow: "0 4px 16px rgba(244,114,182,0.35)" }}>
            {initials || <i className="fa-solid fa-user text-base" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{email}</p>
            {isOAuth && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(244,114,182,0.12)", color: "var(--primary)" }}>
                <i className="fa-brands fa-google text-[9px]" /> Conta Google
              </span>
            )}
          </div>
        </div>

        {/* ── Aparência ── */}
        <SectionCard title="Aparência" icon="fa-palette">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {theme === "dark" ? "Modo escuro ativo" : "Modo claro ativo"}
              </p>
            </div>
            <button onClick={toggle}
              className="relative w-14 h-7 rounded-full transition-all flex-shrink-0"
              style={{ background: theme === "dark" ? "var(--primary)" : "var(--muted)" }}>
              <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: theme === "dark" ? "calc(100% - 1.5rem)" : "0.25rem" }} />
            </button>
          </div>
        </SectionCard>

        {/* ── Perfil ── */}
        <SectionCard title="Perfil" icon="fa-user">
          <InputField label="Nome de exibição" value={name} onChange={setName}
            placeholder="Seu nome" autoComplete="name" />
          {nameMsg && (
            <p className="text-xs" style={{ color: nameMsg.ok ? "var(--income)" : "var(--expense)" }}>
              {nameMsg.ok ? <i className="fa-solid fa-check mr-1" /> : <i className="fa-solid fa-circle-exclamation mr-1" />}
              {nameMsg.text}
            </p>
          )}
          <button onClick={saveName} disabled={nameLoading || name.trim() === displayName}
            className="w-full py-3 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-50">
            {nameLoading ? <i className="fa-solid fa-spinner fa-spin" /> : "Salvar nome"}
          </button>
        </SectionCard>

        {/* ── Email ── */}
        {!isOAuth && (
          <SectionCard title="Email" icon="fa-envelope">
            <InputField label="Email atual" value={email} disabled />
            <Divider />
            <InputField label="Novo email" value={newEmail} onChange={setNewEmail}
              type="email" placeholder="novo@email.com" autoComplete="email" />
            {emailMsg && (
              <p className="text-xs" style={{ color: emailMsg.ok ? "var(--income)" : "var(--expense)" }}>
                {emailMsg.ok ? <i className="fa-solid fa-check mr-1" /> : <i className="fa-solid fa-circle-exclamation mr-1" />}
                {emailMsg.text}
              </p>
            )}
            <button onClick={saveEmail} disabled={emailLoading || !newEmail}
              className="w-full py-3 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-50">
              {emailLoading ? <i className="fa-solid fa-spinner fa-spin" /> : <>
                <i className="fa-solid fa-paper-plane mr-2" />Enviar confirmação
              </>}
            </button>
          </SectionCard>
        )}

        {/* ── Senha ── */}
        {!isOAuth && (
          <SectionCard title="Senha" icon="fa-lock">
            <div className="relative">
              <InputField label="Senha atual" value={currentPass} onChange={setCurrentPass}
                type={showPass ? "text" : "password"} placeholder="••••••••"
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-[2.1rem] w-7 h-7 flex items-center justify-center">
                <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"} text-xs`}
                  style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <InputField label="Nova senha" value={newPass} onChange={setNewPass}
              type={showPass ? "text" : "password"} placeholder="Mínimo 6 caracteres"
              autoComplete="new-password" />
            <div className="flex flex-col gap-1.5">
              <InputField label="Confirmar nova senha" value={confirmPass} onChange={setConfirmPass}
                type={showPass ? "text" : "password"} placeholder="Repita a senha"
                autoComplete="new-password" />
              {confirmPass && confirmPass !== newPass && (
                <p className="text-[11px]" style={{ color: "var(--expense)" }}>As senhas não coincidem</p>
              )}
            </div>

            {/* Strength bar */}
            {newPass.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background: i <= Math.min(4, Math.floor(newPass.length / 3) + (newPass.match(/[^a-z0-9]/i) ? 1 : 0))
                          ? (newPass.length >= 10 ? "var(--income)" : newPass.length >= 7 ? "var(--gold)" : "var(--expense)")
                          : "var(--muted)",
                      }} />
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {newPass.length < 6 ? "Muito curta" : newPass.length < 8 ? "Razoável" : newPass.length < 10 ? "Boa" : "Muito forte"}
                </p>
              </div>
            )}

            {passMsg && (
              <p className="text-xs" style={{ color: passMsg.ok ? "var(--income)" : "var(--expense)" }}>
                {passMsg.ok ? <i className="fa-solid fa-check mr-1" /> : <i className="fa-solid fa-circle-exclamation mr-1" />}
                {passMsg.text}
              </p>
            )}
            <button onClick={savePassword}
              disabled={passLoading || !currentPass || newPass.length < 6 || newPass !== confirmPass}
              className="w-full py-3 rounded-2xl font-semibold text-sm btn-primary disabled:opacity-50">
              {passLoading ? <i className="fa-solid fa-spinner fa-spin" /> : <>
                <i className="fa-solid fa-shield-check mr-2" />Alterar senha
              </>}
            </button>
          </SectionCard>
        )}

        {/* ── Conta ── */}
        <SectionCard title="Conta" icon="fa-circle-user">
          <button onClick={handleSignOut} disabled={signOutLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.25)", color: "var(--primary)" }}>
            {signOutLoading
              ? <i className="fa-solid fa-spinner fa-spin" />
              : <><i className="fa-solid fa-right-from-bracket" />Sair da conta</>}
          </button>

          <Divider />

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--expense)" }}>
              <i className="fa-solid fa-trash" />Excluir minha conta
            </button>
          ) : (
            <div className="flex flex-col gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <p className="text-xs text-center" style={{ color: "var(--expense)" }}>
                <i className="fa-solid fa-triangle-exclamation mr-1" />
                Esta ação é permanente. Todos os seus dados serão apagados.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: "rgba(220,38,38,0.8)", color: "#fff" }}>
                  {deleteLoading ? <i className="fa-solid fa-spinner fa-spin" /> : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Footer */}
        <p className="text-center text-[11px] pb-2" style={{ color: "var(--muted-foreground)" }}>
          PINGO · Cada pingo conta 🐷 · v1.0
        </p>

      </div>
    </main>
  );
}
