import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IndicatorForm } from "@/components/indicators/IndicatorForm";
import { updateIndicator } from "@/lib/actions/indicators.actions";

export default async function EditIndicatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: indicator } = await supabase
    .from("indicators")
    .select("id, name, unit, custom_unit_label")
    .eq("id", id)
    .single();

  if (!indicator) {
    notFound();
  }

  const boundUpdateIndicator = updateIndicator.bind(null, indicator.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Editar indicador</h1>
      <IndicatorForm
        action={boundUpdateIndicator}
        submitLabel="Salvar"
        defaultValues={{
          name: indicator.name,
          unit: indicator.unit,
          customUnitLabel: indicator.custom_unit_label,
        }}
      />
    </div>
  );
}
