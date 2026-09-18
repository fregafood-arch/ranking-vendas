"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { sellerFormSchema } from "@/lib/validations/seller";

export type SellerFormState = { error: string } | undefined;

const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function readSellerFields(formData: FormData) {
  return sellerFormSchema.safeParse({
    fullName: formData.get("fullName"),
    roleTitle: formData.get("roleTitle"),
    teamId: formData.get("teamId"),
    startDate: formData.get("startDate"),
  });
}

function readPhoto(formData: FormData): File | null {
  const photo = formData.get("photo");
  return photo instanceof File && photo.size > 0 ? photo : null;
}

function validatePhoto(photo: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
    return "A foto deve ser PNG, JPEG ou WEBP.";
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return "A foto deve ter no máximo 5 MB.";
  }
  return null;
}

async function uploadSellerPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sellerId: string,
  photo: File,
): Promise<string> {
  const extension = EXTENSION_BY_TYPE[photo.type] ?? "jpg";
  const path = `${sellerId}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("seller-photos")
    .upload(path, photo, { contentType: photo.type, upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

/**
 * Não valida contra um schema de banco tipado (não temos Database types
 * gerados ainda — precisa de `supabase gen types`, que requer o projeto
 * linkado via CLI). Os nomes de coluna abaixo espelham
 * supabase/migrations/0001_schema.sql.
 */
export async function createSeller(
  _prevState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  await requireAdmin();

  const parsed = readSellerFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const photo = readPhoto(formData);
  if (photo) {
    const photoError = validatePhoto(photo);
    if (photoError) return { error: photoError };
  }

  const supabase = await createClient();
  const { fullName, roleTitle, teamId, startDate } = parsed.data;

  const { data: seller, error: insertError } = await supabase
    .from("sellers")
    .insert({
      full_name: fullName,
      role_title: roleTitle || null,
      team_id: teamId || null,
      start_date: startDate,
    })
    .select("id")
    .single();

  if (insertError || !seller) {
    return {
      error: `Não foi possível cadastrar o vendedor: ${insertError?.message ?? "erro desconhecido"}`,
    };
  }

  if (photo) {
    try {
      const path = await uploadSellerPhoto(supabase, seller.id, photo);
      await supabase.from("sellers").update({ photo_path: path }).eq("id", seller.id);
    } catch {
      // O vendedor já foi criado — não desfazemos o cadastro por causa da
      // foto. O admin pode reenviar editando o cadastro.
      revalidatePath("/admin/vendedores");
      redirect("/admin/vendedores?photoUploadFailed=1");
    }
  }

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores");
}

export async function updateSeller(
  sellerId: string,
  _prevState: SellerFormState,
  formData: FormData,
): Promise<SellerFormState> {
  await requireAdmin();

  const parsed = readSellerFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const photo = readPhoto(formData);
  if (photo) {
    const photoError = validatePhoto(photo);
    if (photoError) return { error: photoError };
  }

  const supabase = await createClient();
  const { fullName, roleTitle, teamId, startDate } = parsed.data;

  const updates: Record<string, string | null> = {
    full_name: fullName,
    role_title: roleTitle || null,
    team_id: teamId || null,
    start_date: startDate,
  };

  let previousPhotoPath: string | null = null;

  if (photo) {
    const { data: current } = await supabase
      .from("sellers")
      .select("photo_path")
      .eq("id", sellerId)
      .single();
    previousPhotoPath = current?.photo_path ?? null;

    try {
      updates.photo_path = await uploadSellerPhoto(supabase, sellerId, photo);
    } catch (err) {
      return {
        error: `Falha ao enviar a foto: ${err instanceof Error ? err.message : "erro desconhecido"}`,
      };
    }
  }

  const { error: updateError } = await supabase
    .from("sellers")
    .update(updates)
    .eq("id", sellerId);

  if (updateError) {
    return { error: `Não foi possível salvar: ${updateError.message}` };
  }

  if (photo && previousPhotoPath) {
    await supabase.storage.from("seller-photos").remove([previousPhotoPath]);
  }

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores");
}

export async function setSellerActive(sellerId: string, isActive: boolean): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("sellers")
    .update({ is_active: isActive })
    .eq("id", sellerId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/vendedores");
}
