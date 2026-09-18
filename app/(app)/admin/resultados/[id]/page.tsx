import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResultForm } from "@/components/results/ResultForm";
import { updateSalesResult } from "@/lib/actions/sales-results.actions";

export default async function EditResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: result }, { data: sellers }, { data: indicators }] = await Promise.all([
    supabase
      .from("sales_results")
      .select("id, seller_id, indicator_id, value, entry_date, notes")
      .eq("id", id)
      .single(),
    // Sem filtro de "ativo" aqui: o lançamento pode referenciar um
    // vendedor/indicador já inativado, e o select precisa continuar
    // mostrando a opção selecionada.
    supabase.from("sellers").select("id, full_name").order("full_name"),
    supabase.from("indicators").select("id, name, unit").order("name"),
  ]);

  if (!result) {
    notFound();
  }

  const boundUpdateSalesResult = updateSalesResult.bind(null, result.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar lançamento</h1>
      <ResultForm
        action={boundUpdateSalesResult}
        sellers={(sellers ?? []).map((seller) => ({ id: seller.id, label: seller.full_name }))}
        indicators={(indicators ?? []).map((indicator) => ({
          id: indicator.id,
          label: `${indicator.name} (${indicator.unit})`,
        }))}
        submitLabel="Salvar"
        defaultValues={{
          sellerId: result.seller_id,
          indicatorId: result.indicator_id,
          value: Number(result.value),
          entryDate: result.entry_date,
          notes: result.notes,
        }}
      />
    </div>
  );
}
