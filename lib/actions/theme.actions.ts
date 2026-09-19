"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import type { AppTheme } from "@/lib/theme-types";

export async function setActiveTheme(theme: AppTheme): Promise<{ error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("settings")
    .select("key")
    .eq("key", "ui.theme")
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("settings").update({ value: theme }).eq("key", "ui.theme")
    : await supabase
        .from("settings")
        .insert({ key: "ui.theme", value: theme, description: "Skin visual do ranking/pódio/TV" });

  if (error) {
    return { error: error.message };
  }

  // Impacta varias telas (ranking, TV, dashboard) - revalida o app inteiro.
  revalidatePath("/", "layout");
  return {};
}
