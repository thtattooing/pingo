import { SupabaseClient } from "@supabase/supabase-js";

/** Normaliza descrição para usar como chave de memória */
export function descriptionKey(raw: string): string {
  return raw
    .normalize("NFD").replace(/[̀-ͯ]/g, "")  // remove acentos
    .toLowerCase()
    .replace(/\s*\d{1,2}\/\d{1,3}\s*/g, " ")           // remove parcelas "2/12"
    .replace(/\s*\d{2}\/\d{2}\/\d{4}\s*/g, " ")        // remove datas
    .replace(/[^a-z0-9\s]/g, " ")                       // só alfanumérico
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

/** Carrega mapa description_key → category_id do usuário */
export async function loadCategoryRules(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, string>> {
  try {
    const { data } = await supabase
      .from("category_rules")
      .select("description_key,category_id")
      .eq("user_id", userId);
    const map = new Map<string, string>();
    (data ?? []).forEach(r => map.set(r.description_key, r.category_id));
    return map;
  } catch {
    return new Map();
  }
}

/** Salva ou incrementa regra quando usuário muda categoria de uma transação */
export async function saveCategoryRule(
  supabase: SupabaseClient,
  userId: string,
  description: string,
  categoryId: string,
): Promise<void> {
  const key = descriptionKey(description);
  if (!key) return;
  try {
    await supabase.from("category_rules").upsert(
      { user_id: userId, description_key: key, category_id: categoryId, use_count: 1, updated_at: new Date().toISOString() },
      { onConflict: "user_id,description_key" },
    );
  } catch {
    // tabela pode ainda não existir — silencioso
  }
}

/** Aplica regras do usuário sobre uma lista de itens com description + categoryId */
export function applyRules<T extends { description: string; categoryId: string }>(
  items: T[],
  rules: Map<string, string>,
): T[] {
  return items.map(item => {
    const key = descriptionKey(item.description);
    const learned = rules.get(key);
    return learned ? { ...item, categoryId: learned } : item;
  });
}
