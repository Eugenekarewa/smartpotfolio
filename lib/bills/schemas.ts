import { z } from "zod";
import { BILL_RECURRENCES } from "@/lib/db/models/Bill";

export const createBillSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    accountId: z.string().min(1).optional(),
    amountCents: z.number().int().min(1),
    recurrence: z.enum(BILL_RECURRENCES),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    firstDueAt: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if ((data.recurrence === "custom_dom" || data.recurrence === "monthly") && data.dayOfMonth === undefined) {
      ctx.addIssue({ code: "custom", message: "dayOfMonth is required for this recurrence", path: ["dayOfMonth"] });
    }
  });

export const updateBillSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  amountCents: z.number().int().min(1).optional(),
});

export const markPaidSchema = z.object({
  accountId: z.string().min(1).optional(),
  paidAt: z.string().min(1).optional(),
});
