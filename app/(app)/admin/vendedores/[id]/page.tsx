import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SellerForm } from "@/components/sellers/SellerForm";
import { updateSeller } from "@/lib/actions/sellers.actions";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: seller }, { data: teams }] = await Promise.all([
    supabase
      .from("sellers")
      .select("id, full_name, role_title, team_id, start_date")
      .eq("id", id)
      .single(),
    supabase.from("teams").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!seller) {
    notFound();
  }

  const boundUpdateSeller = updateSeller.bind(null, seller.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar vendedor</h1>
      <SellerForm
        action={boundUpdateSeller}
        teams={teams ?? []}
        submitLabel="Salvar"
        defaultValues={{
          fullName: seller.full_name,
          roleTitle: seller.role_title,
          teamId: seller.team_id,
          startDate: seller.start_date,
        }}
      />
    </div>
  );
}
