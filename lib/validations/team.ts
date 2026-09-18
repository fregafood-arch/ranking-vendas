import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da equipe."),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;
