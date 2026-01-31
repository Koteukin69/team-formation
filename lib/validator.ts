import {z, ZodObject} from 'zod';

export const requestCodeSchema : ZodObject = z.object({
  email: z.email(),
});

export const verifyCodeSchema : ZodObject = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, "Введите 6 цифр"),
});