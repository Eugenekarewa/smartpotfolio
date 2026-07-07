import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const addBusinessTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int().min(1),
  category: z.string().trim().max(60).optional(),
  note: z.string().trim().max(280).optional(),
  at: z.string().min(1).optional(),
});

export const ownerDrawSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountCents: z.number().int().min(1),
  at: z.string().min(1).optional(),
});
