import { createClient } from "@/lib/supabase/server";
import { SellerForm } from "@/components/sellers/SellerForm";
import { createSeller } from "@/lib/actions/sellers.actions";

export default async function NewSellerPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Novo vendedor</h1>
      <SellerForm action={createSeller} teams={teams ?? []} submitLabel="Cadastrar" />
    </div>
  );
}
