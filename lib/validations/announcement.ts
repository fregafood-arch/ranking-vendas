import { z } from "zod";

export const announcementFormSchema = z.object({
  title: z.string().trim().optional(),
  body: z.string().trim().min(1, "Escreva o aviso."),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
