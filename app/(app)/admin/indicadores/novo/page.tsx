import { IndicatorForm } from "@/components/indicators/IndicatorForm";
import { createIndicator } from "@/lib/actions/indicators.actions";

export default function NewIndicatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Novo indicador</h1>
      <IndicatorForm action={createIndicator} submitLabel="Cadastrar" />
    </div>
  );
}
