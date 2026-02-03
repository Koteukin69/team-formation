import { z } from "zod/v4";

export const marathonSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  topic: z.string().nullish().transform(v => v ?? ""),
  description: z.string().nullish().transform(v => v ?? ""),
  minTeamSize: z.number().int().positive(),
  maxTeamSize: z.number().int().positive(),
  createdAt: z.date(),
});

export type Marathon = z.infer<typeof marathonSchema>;

export function validateMarathon(data: unknown): Marathon {
  return marathonSchema.parse(data);
}

export function validateMarathonSafe(data: unknown): { success: true; data: Marathon } | { success: false; error: z.ZodError } {
  const result = marathonSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
