import { z } from "zod";

export const flashChallengeFormSchema = z.object({
  title: z.string().trim().min(2, "Informe um título para o desafio."),
  description: z.string().trim().max(500).optional(),
  prizeLabel: z.string().trim().min(2, "Informe o prêmio do desafio."),
  endsAt: z
    .string()
    .trim()
    .min(1, "Informe a data e hora final.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data e hora inválidas."),
});

export type FlashChallengeFormValues = z.infer<typeof flashChallengeFormSchema>;
