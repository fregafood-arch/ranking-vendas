import { z } from "zod";

export const TRIGGER_TYPE_OPTIONS = [
  { value: "GOAL_ATTAINMENT_PCT", label: "% da meta atingida" },
  { value: "RANKING_POSITION", label: "Posição no Ranking Geral" },
  { value: "STREAK", label: "Número de lançamentos (sequência)" },
  { value: "ABSOLUTE_VALUE", label: "Maior valor único do período" },
] as const;

export const COMPARISON_OPERATOR_OPTIONS = [
  { value: "GTE", label: "≥ (maior ou igual)" },
  { value: "GT", label: "> (maior que)" },
  { value: "LTE", label: "≤ (menor ou igual)" },
  { value: "LT", label: "< (menor que)" },
  { value: "EQ", label: "= (igual)" },
] as const;

export const SCOPE_OPTIONS = [
  { value: "PERIOD", label: "Por período" },
  { value: "ALL_TIME", label: "Uma vez só (histórico)" },
  { value: "ROLLING_WINDOW", label: "Janela de dias corridos" },
] as const;

const TRIGGER_TYPE_VALUES = TRIGGER_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]];
const COMPARISON_OPERATOR_VALUES = COMPARISON_OPERATOR_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const SCOPE_VALUES = SCOPE_OPTIONS.map((o) => o.value) as [string, ...string[]];

export const achievementFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome da conquista."),
    icon: z.string().trim().min(1, "Informe um emoji para o ícone."),
    description: z.string().trim().max(300).optional(),
    triggerType: z.enum(TRIGGER_TYPE_VALUES, { error: "Selecione o tipo de gatilho." }),
    indicatorId: z.string().trim().optional(),
    comparisonOperator: z.enum(COMPARISON_OPERATOR_VALUES, { error: "Selecione o operador." }),
    thresholdValue: z
      .string()
      .trim()
      .min(1, "Informe o valor de referência.")
      .refine((value) => !Number.isNaN(Number(value)), "Valor inválido."),
    scope: z.enum(SCOPE_VALUES, { error: "Selecione o escopo." }),
    rollingWindowDays: z.string().trim().optional(),
  })
  .refine(
    (data) => data.triggerType !== "STREAK" && data.triggerType !== "ABSOLUTE_VALUE"
      ? true
      : !!data.indicatorId,
    "Este tipo de gatilho exige um indicador.",
  )
  .refine(
    (data) => data.scope !== "ROLLING_WINDOW" || !!data.rollingWindowDays,
    "Informe quantos dias tem a janela rolante.",
  );

export type AchievementFormValues = z.infer<typeof achievementFormSchema>;
