"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Cat { id: string; name: string; icon: string; color: string }

const PRESET_COLORS = [
  "#F59E0B","#3B82F6","#8B5CF6","#EC4899","#06B6D4",
  "#A855F7","#14B8A6","#EAB308","#0EA5E9","#F97316",
  "#10B981","#059669","#6366F1","#64748B","#EF4444",
  "#F472B6","#34D399","#FB923C","#A78BFA","#22D3EE",
];

const PRESET_ICONS = [
  "fa-tag","fa-star","fa-heart","fa-fire","fa-leaf","fa-paw",
  "fa-music","fa-camera","fa-plane","fa-bicycle","fa-gift","fa-graduation-cap",
  "fa-dumbbell","fa-paint-brush","fa-tools","fa-laptop","fa-gamepad","fa-baby",
  "fa-dog","fa-cat","fa-seedling","fa-book","fa-wine-glass","fa-umbrella",
  "fa-car-side","fa-home","fa-briefcase","fa-stethoscope","fa-shopping-bag","fa-hammer",
];

export default function CategoriasClient({
  builtInCategories, customCategories, userId,
}: {
  builtInCategories: Cat[];
  customCategories: Cat[];
  userId: string;
}) {
  const router = useRouter();
  const [customs, setCustoms] = useState<Cat[]>(customCategories);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [color, setColor]       = useState(PRESET_COLORS[0]);
  const [icon, setIcon]         = useState(PRESET_ICONS[0]);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true); setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("custom_categories")
      .insert({ user_id: userId, name: name.trim(), icon, color })
      .select("id,name,icon,color")
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    setCustoms(prev => [...prev, data as Cat]);
    setName(""); setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("custom_categories").delete().eq("id", id).eq("user_id", userId);
    setCustoms(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="px-5 flex flex-col gap-4">

      {/* Custom categories */}
      <div className="card-pingo flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Minhas categorias</p>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: showForm ? "rgba(244,114,182,0.15)" : "var(--input)",
              color: showForm ? "var(--primary)" : "var(--muted-foreground)",
              border: `1px solid ${showForm ? "rgba(244,114,182,0.3)" : "transparent"}`,
            }}>
            <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"} text-xs`} />
            {showForm ? "Cancelar" : "Criar"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up"
            style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Nome</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Pets, Viagem, Academia..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Cor</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-lg transition-all"
                    style={{
                      background: c,
                      border: color === c ? `2px solid var(--foreground)` : "2px solid transparent",
                      transform: color === c ? "scale(1.2)" : "scale(1)",
                    }} />
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Ícone</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: icon === ic ? `${color}25` : "var(--card)",
                      border: `1px solid ${icon === ic ? color + "60" : "transparent"}`,
                    }}>
                    <i className={`fa-solid ${ic} text-sm`} style={{ color: icon === ic ? color : "var(--muted-foreground)" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}25` }}>
                <i className={`fa-solid ${icon}`} style={{ color }} />
              </div>
              <span className="text-sm font-medium">{name || "Prévia da categoria"}</span>
            </div>

            {error && <p className="text-xs" style={{ color: "var(--expense)" }}>{error}</p>}

            <button onClick={handleCreate} disabled={saving || !name.trim()}
              className="w-full py-3 rounded-2xl text-sm font-semibold btn-primary disabled:opacity-40">
              {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-plus mr-2" />Criar categoria</>}
            </button>
          </div>
        )}

        {customs.length === 0 && !showForm && (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>
            Nenhuma categoria personalizada ainda
          </p>
        )}

        {customs.map(c => (
          <div key={c.id} className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${c.color}20` }}>
              <i className={`fa-solid ${c.icon} text-sm`} style={{ color: c.color }} />
            </div>
            <span className="flex-1 text-sm font-medium">{c.name}</span>
            <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)" }}>
              {deleting === c.id
                ? <i className="fa-solid fa-spinner fa-spin text-xs" style={{ color: "var(--expense)" }} />
                : <i className="fa-solid fa-trash text-xs" style={{ color: "var(--expense)" }} />}
            </button>
          </div>
        ))}
      </div>

      {/* Built-in categories */}
      <div className="card-pingo flex flex-col gap-3">
        <p className="text-sm font-semibold">Categorias padrão</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          As categorias padrão são detectadas automaticamente pelo PINGO. Não é possível removê-las.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {builtInCategories.map(c => (
            <div key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--input)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${c.color}20` }}>
                <i className={`fa-solid ${c.icon} text-xs`} style={{ color: c.color }} />
              </div>
              <span className="text-xs font-medium truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
