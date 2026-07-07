import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});
