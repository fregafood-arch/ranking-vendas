import { z } from "zod";

export const UNIT_OPTIONS = [
  { value: "BRL", label: "R$ (Reais)" },
  { value: "PERCENT", label: "%" },
  { value: "POINTS", label: "Pontos" },
  { value: "VIDAS", label: "Vidas" },
  { value: "CONTRACTS", label: "Contratos" },
  { value: "SALES", label: "Vendas" },
  { value: "CLIENTS", label: "Clientes" },
  { value: "CALLS", label: "Ligações" },
  { value: "MEETINGS", label: "Reuniões" },
  { value: "LEADS", label: "Leads" },
  { value: "UNITS", label: "Unidades" },
  { value: "CUSTOM", label: "Personalizada" },
] as const;

export const UNIT_LABELS: Record<string, string> = Object.fromEntries(
  UNIT_OPTIONS.map((option) => [option.value, option.label]),
);

const UNIT_VALUES = UNIT_OPTIONS.map((option) => option.value) as [string, ...string[]];

export const indicatorFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do indicador."),
    unit: z.enum(UNIT_VALUES, { error: "Selecione uma unidade." }),
    customUnitLabel: z.string().trim().optional(),
  })
  .refine(
    (data) => data.unit !== "CUSTOM" || !!data.customUnitLabel,
    "Informe o nome da unidade personalizada.",
  );

export type IndicatorFormValues = z.infer<typeof indicatorFormSchema>;
