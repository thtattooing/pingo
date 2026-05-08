"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

export interface GoalRow {
  category_id: string;
  limit_amount: number | null;
  spent: number;
}

interface Props {
  goals: GoalRow[];
  month: number;
  year: number;
  userId: string;
}

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function GoalEditor({ goals: initialGoals, month, year, userId }: Props) {
  const [goals, setGoals] = useState<GoalRow[]>(initialGoals);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveGoal(categoryId: string) {
    const parsed = parseFloat(inputVal.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) { setEditing(null); return; }
    setSaving(true);
    const supabase = createClient();
    await supabase.from("goals").upsert(
      { user_id: userId, category_id: categoryId, limit_amount: parsed, month, year },
      { onConflict: "user_id,category_id,month,year" }
    );
    setGoals(prev => prev.map(g =>
      g.category_id === categoryId ? { ...g, limit_amount: parsed } : g
    ));
    setSaving(false);
    setEditing(null);
  }

  async function removeGoal(categoryId: string) {
    const supabase = createClient();
    await supabase
      .from("goals")
      .delete()
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("month", month)
      .eq("year", year);
    setGoals(prev => prev.map(g =>
      g.category_id === categoryId ? { ...g, limit_amount: null } : g
    ));
  }

  const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div className="card-pingo flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          Metas — {MONTH_NAMES[month - 1]}/{year}
        </h3>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Limite por categoria
        </span>
      </div>

      {goals.map(goal => {
        const cat = CATEGORIES.find(c => c.id === goal.category_id);
        if (!cat) return null;
        const hasLimit = goal.limit_amount !== null && goal.limit_amount > 0;
        const pct = hasLimit ? Math.min((goal.spent / goal.limit_amount!) * 100, 100) : 0;
        const over = hasLimit && goal.spent > goal.limit_amount!;
        const warn = hasLimit && pct >= 80;
        const isEditing = editing === goal.category_id;

        return (
          <div key={goal.category_id}>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${cat.color}20` }}
              >
                <i className={`fa-solid ${cat.icon} text-xs`} style={{ color: cat.color }} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span
                    className="mono-data text-xs"
                    style={{ color: over ? "var(--expense)" : warn ? "var(--gold)" : "var(--muted-foreground)" }}
                  >
                    {BRL(goal.spent)}
                    {hasLimit && <span style={{ color: "var(--muted-foreground)" }}> / {BRL(goal.limit_amount!)}</span>}
                  </span>
                </div>

                {hasLimit && (
                  <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: over ? "var(--expense)" : warn ? "var(--gold)" : cat.color,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Edit / Remove */}
              {!isEditing && (
                <button
                  onClick={() => { setEditing(goal.category_id); setInputVal(String(goal.limit_amount ?? "")); }}
                  className="text-[10px] px-2 py-1 rounded-lg"
                  style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
                >
                  {hasLimit ? "Editar" : "Definir"}
                </button>
              )}
              {!isEditing && hasLimit && (
                <button
                  onClick={() => removeGoal(goal.category_id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  <i className="fa-solid fa-xmark text-[9px]" style={{ color: "var(--expense)" }} />
                </button>
              )}
            </div>

            {/* Inline edit */}
            {isEditing && (
              <div className="flex gap-2 pl-11 mt-1">
                <div
                  className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
                  style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>R$</span>
                  <input
                    type="number"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveGoal(goal.category_id); if (e.key === "Escape") setEditing(null); }}
                    placeholder="0,00"
                    className="flex-1 bg-transparent outline-none text-sm mono-data"
                    style={{ color: "var(--foreground)" }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => saveGoal(goal.category_id)}
                  disabled={saving}
                  className="px-3 rounded-xl text-xs font-semibold btn-primary"
                >
                  {saving ? <i className="fa-solid fa-spinner fa-spin" /> : "Salvar"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 rounded-xl text-xs"
                  style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
