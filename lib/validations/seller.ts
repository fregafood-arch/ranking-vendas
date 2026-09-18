import { z } from "zod";

export const sellerFormSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  roleTitle: z.string().trim().max(120).optional(),
  teamId: z.string().trim().optional(),
  startDate: z
    .string()
    .trim()
    .min(1, "Informe a data de entrada.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida."),
});

export type SellerFormValues = z.infer<typeof sellerFormSchema>;
