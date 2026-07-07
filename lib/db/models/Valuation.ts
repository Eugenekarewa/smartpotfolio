import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

/**
 * Append-only. Never update or delete a valuation once written — correct a
 * mistake by writing a new one. Current value is always derived by reducing
 * this log (NFR-6), never stored as a mutable running total.
 */
const valuationSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    valueCents: { type: Number, required: true },
    at: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ["manual", "auto"], required: true, default: "manual" },
  },
  { timestamps: true }
);

valuationSchema.plugin(userScoped);
valuationSchema.index({ accountId: 1, at: -1 });

export type ValuationDoc = InferSchemaType<typeof valuationSchema>;

export const Valuation = models.Valuation ?? model("Valuation", valuationSchema);
