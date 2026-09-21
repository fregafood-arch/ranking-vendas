"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { flashChallengeFormSchema } from "@/lib/validations/flash-challenge";

export type FlashChallengeFormState = { error: string } | undefined;

export async function createFlashChallenge(
  _prevState: FlashChallengeFormState,
  formData: FormData,
): Promise<FlashChallengeFormState> {
  await requireAdmin();

  const parsed = flashChallengeFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    prizeLabel: formData.get("prizeLabel"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { title, description, prizeLabel, endsAt } = parsed.data;

  const { error } = await supabase.from("flash_challenges").insert({
    title,
    description: description || null,
    prize_label: prizeLabel,
    ends_at: new Date(endsAt).toISOString(),
  });

  if (error) {
    return { error: `Não foi possível criar o desafio: ${error.message}` };
  }

  revalidatePath("/admin/desafios");
  return undefined;
}

export async function setFlashChallengeActive(challengeId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("flash_challenges")
    .update({ is_active: isActive })
    .eq("id", challengeId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/desafios");
}

export async function deleteFlashChallenge(challengeId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("flash_challenges").delete().eq("id", challengeId);

  if (error) {
    throw new Error(`Não foi possível excluir: ${error.message}`);
  }

  revalidatePath("/admin/desafios");
}
