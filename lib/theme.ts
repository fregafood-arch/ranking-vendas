import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type { AppTheme } from "@/lib/theme-types";
export { THEME_OPTIONS } from "@/lib/theme-types";

import type { AppTheme } from "@/lib/theme-types";

/**
 * Skin visual (ETAPA extra, a pedido do usuário): configuração global,
 * guardada em settings (key='ui.theme'), não por vendedor/sessão — faz
 * sentido ser global já que a mesma tela aparece pra equipe toda e na TV
 * do escritório.
 */
export async function getActiveTheme(client?: SupabaseClient): Promise<AppTheme> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ui.theme")
    .maybeSingle();

  if (data?.value === "game" || data?.value === "zoeira" || data?.value === "holofote") {
    return data.value;
  }
  return "default";
}
