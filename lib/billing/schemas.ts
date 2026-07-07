import { z } from "zod";

export const upgradeSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^254[17]\d{8}$/, "Use format 2547XXXXXXXX or 2541XXXXXXXX"),
});
