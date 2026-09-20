import { createClient } from "@/lib/supabase/server";
import { ResultForm } from "@/components/results/ResultForm";
import { ResultsHistoryTable } from "@/components/results/ResultsHistoryTable";
import { createSalesResult } from "@/lib/actions/sales-results.actions";
import { formatIndicatorValue } from "@/lib/format";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function AdminResultsPage() {
  const supabase = await createClient();

  const [{ data: sellers }, { data: indicators }, { data: results }] = await Promise.all([
    supabase.from("sellers").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    supabase
      .from("sales_results")
      .select("id, value, entry_date, sellers(full_name), indicators(name, unit)")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // supabase-js tipa relações embutidas como array por padrão (não temos
  // Database types gerados); em runtime, uma relação many-to-one (FK na
  // própria tabela, como sales_results.seller_id) sempre vem como objeto
  // único — foi exatamente esse descompasso que causou vendedor/indicador
  // aparecendo em branco no histórico até este ajuste.
  type ResultRow = NonNullable<typeof results>[number];
  type ResultWithRelations = Omit<ResultRow, "sellers" | "indicators"> & {
    sellers: { full_name: string } | null;
    indicators: { name: string; unit: string } | null;
  };
  const resultRows = (results ?? []) as unknown as ResultWithRelations[];

  const sellerOptions = (sellers ?? []).map((seller) => ({ id: seller.id, label: seller.full_name }));
  const indicatorOptions = (indicators ?? []).map((indicator) => ({
    id: indicator.id,
    label: `${indicator.name} (${indicator.unit})`,
  }));

  const historyRows = resultRows.map((result) => ({
    id: result.id,
    sellerName: result.sellers?.full_name ?? "—",
    indicatorLabel: result.indicators ? `${result.indicators.name} (${result.indicators.unit})` : "—",
    valueLabel: result.indicators
      ? formatIndicatorValue(Number(result.value), result.indicators.unit)
      : Number(result.value).toLocaleString("pt-BR"),
    dateLabel: formatDate(result.entry_date),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-50">Lançamento de Resultados</h1>
        <p className="text-sm text-neutral-400">Vendedor → Indicador → Valor → Data</p>
      </div>

      <ResultForm
        action={createSalesResult}
        sellers={sellerOptions}
        indicators={indicatorOptions}
        submitLabel="Lançar"
      />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Histórico</h2>
        <p className="text-xs text-neutral-500">Mostrando os 100 lançamentos mais recentes.</p>
        <ResultsHistoryTable rows={historyRows} />
      </section>
    </div>
  );
}
