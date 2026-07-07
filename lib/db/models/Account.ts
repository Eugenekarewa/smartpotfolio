import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

export const ACCOUNT_TYPES = [
  "cash",
  "mmf",
  "stock",
  "sacco",
  "tbill_bond",
  "crypto",
  "property",
  "vehicle",
  "other_asset",
  "loan",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

const accountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
    costBasisCents: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
    meta: {
      // stock/crypto
      ticker: { type: String },
      units: { type: Number },
      // tbill_bond
      faceValueCents: { type: Number },
      rateBps: { type: Number }, // basis points, e.g. 1550 = 15.50%
      maturityDate: { type: Date },
      // loan
      interestRateBps: { type: Number },
      originalPrincipalCents: { type: Number },
    },
  },
  { timestamps: true }
);

accountSchema.plugin(userScoped);
accountSchema.index({ userId: 1, type: 1 });

export type AccountDoc = InferSchemaType<typeof accountSchema>;

export const Account = models.Account ?? model("Account", accountSchema);
