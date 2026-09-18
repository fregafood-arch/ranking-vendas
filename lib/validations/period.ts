import { z } from "zod";

export const PERIOD_TYPE_OPTIONS = [
  { value: "DAILY", label: "Diário" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

export const PERIOD_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PERIOD_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const PERIOD_TYPE_VALUES = PERIOD_TYPE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

export const periodFormSchema = z
  .object({
    type: z.enum(PERIOD_TYPE_VALUES, { error: "Selecione o tipo de período." }),
    label: z.string().trim().min(2, "Informe um rótulo para o período."),
    startDate: z.string().trim().min(1, "Informe a data inicial."),
    endDate: z.string().trim().min(1, "Informe a data final."),
  })
  .refine(
    (data) => Date.parse(data.startDate) <= Date.parse(data.endDate),
    "A data final deve ser igual ou posterior à inicial.",
  );

export type PeriodFormValues = z.infer<typeof periodFormSchema>;
