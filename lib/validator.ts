import {z, ZodObject} from 'zod';

export const requestCodeSchema : ZodObject = z.object({
  email: z.email(),
});

export const verifyCodeSchema : ZodObject = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, "Введите 6 цифр"),
});

export const marathonInputSchema = z.object({
  name: z.string().min(1, "Введите название").max(100, "Максимум 100 символов").trim(),
  slug: z.string()
    .min(3, "Минимум 3 символа")
    .max(16, "Максимум 16 символов")
    .regex(/^[a-z0-9_-]+$/, "Только латинские буквы, цифры, '-' и '_'")
    .transform(s => s.toLowerCase()),
  topic: z.string().max(100, "Максимум 100 символов").trim().optional().default(""),
  description: z.string().max(1000, "Максимум 1000 символов").trim().optional().default(""),
  minTeamSize: z.number().int().min(1, "Минимум 1").max(100, "Максимум 100"),
  maxTeamSize: z.number().int().min(1, "Минимум 1").max(100, "Максимум 100"),
}).refine(data => data.maxTeamSize >= data.minTeamSize, {
  message: "Максимум должен быть >= минимума",
  path: ["maxTeamSize"],
});

/** @deprecated Use marathonInputSchema instead */
export const marathonSchema = marathonInputSchema;

