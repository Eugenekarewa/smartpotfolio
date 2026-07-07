import { z } from "zod";
import { ACCOUNT_TYPES } from "@/lib/db/models/Account";

const metaSchema = z.object({
  ticker: z.string().trim().min(1).max(20).optional(),
  units: z.number().positive().optional(),
  faceValueCents: z.number().int().min(0).optional(),
  rateBps: z.number().int().min(0).optional(),
  maturityDate: z.string().min(1).optional(),
  interestRateBps: z.number().int().min(0).optional(),
  originalPrincipalCents: z.number().int().min(0).optional(),
});

export const createAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(ACCOUNT_TYPES),
    initialValueCents: z.number().int().min(0),
    costBasisCents: z.number().int().min(0).optional(),
    businessId: z.string().min(1).optional(),
    meta: metaSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const meta = data.meta;
    if (data.type === "stock" || data.type === "crypto") {
      if (!meta?.ticker || meta.units === undefined) {
        ctx.addIssue({ code: "custom", message: "ticker and units are required", path: ["meta"] });
      }
    }
    if (data.type === "tbill_bond") {
      if (meta?.faceValueCents === undefined || meta.rateBps === undefined || !meta.maturityDate) {
        ctx.addIssue({
          code: "custom",
          message: "faceValueCents, rateBps and maturityDate are required",
          path: ["meta"],
        });
      }
    }
    if (data.type === "loan") {
      if (meta?.interestRateBps === undefined || meta.originalPrincipalCents === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "interestRateBps and originalPrincipalCents are required",
          path: ["meta"],
        });
      }
    }
  });

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  archived: z.boolean().optional(),
});

export const addValuationSchema = z.object({
  valueCents: z.number().int().min(0),
  at: z.string().min(1).optional(),
});
