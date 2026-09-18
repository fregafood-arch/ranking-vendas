import { PeriodForm } from "@/components/periods/PeriodForm";
import { createPeriod } from "@/lib/actions/periods.actions";

export default function NewPeriodPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">Novo período</h1>
      <PeriodForm action={createPeriod} submitLabel="Criar" />
    </div>
  );
}
