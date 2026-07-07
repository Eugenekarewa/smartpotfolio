import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Idempotency log for payment webhooks (FR-7.2). Client-reported payment
 * status is never trusted — only signed webhook events land here, deduped
 * on the provider's event ID.
 */
const paymentEventSchema = new Schema(
  {
    provider: { type: String, enum: ["intasend"], required: true },
    eventId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date, default: Date.now },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export type PaymentEventDoc = InferSchemaType<typeof paymentEventSchema>;

export const PaymentEvent = models.PaymentEvent ?? model("PaymentEvent", paymentEventSchema);
