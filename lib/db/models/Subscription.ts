import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

/**
 * Premium entitlement is derived from currentPeriodEnd > now (FR-7.3),
 * never a cached boolean — see lib/billing/entitlement.ts.
 */
const subscriptionSchema = new Schema(
  {
    provider: { type: String, enum: ["intasend"], required: true, default: "intasend" },
    status: {
      type: String,
      enum: ["trialing", "active", "grace", "canceled", "expired"],
      required: true,
      default: "trialing",
    },
    currentPeriodEnd: { type: Date, required: true },
    mpesaNumber: { type: String },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.plugin(userScoped);
subscriptionSchema.index({ userId: 1 }, { unique: true });

export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema>;

export const Subscription = models.Subscription ?? model("Subscription", subscriptionSchema);
