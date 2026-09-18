import { z } from "zod";

export const salesResultFormSchema = z.object({
  sellerId: z.string().trim().min(1, "Selecione o vendedor."),
  indicatorId: z.string().trim().min(1, "Selecione o indicador."),
  value: z
    .string()
    .trim()
    .min(1, "Informe o valor.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "O valor deve ser um número maior ou igual a zero.",
    ),
  entryDate: z.string().trim().min(1, "Informe a data."),
  notes: z.string().trim().max(500).optional(),
});

export type SalesResultFormValues = z.infer<typeof salesResultFormSchema>;
