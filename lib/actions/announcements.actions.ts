"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { announcementFormSchema } from "@/lib/validations/announcement";

export type AnnouncementFormState = { error: string } | undefined;

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await requireAdmin();

  const parsed = announcementFormSchema.safeParse({
    title: formData.get("title") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { title, body } = parsed.data;

  const { error } = await supabase.from("announcements").insert({
    title: title || null,
    body,
  });

  if (error) {
    return { error: `Não foi possível salvar o aviso: ${error.message}` };
  }

  revalidatePath("/admin/avisos");
  return undefined;
}

export async function setAnnouncementActive(announcementId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update({ is_active: isActive })
    .eq("id", announcementId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/avisos");
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").delete().eq("id", announcementId);

  if (error) {
    throw new Error(`Não foi possível excluir: ${error.message}`);
  }

  revalidatePath("/admin/avisos");
}
