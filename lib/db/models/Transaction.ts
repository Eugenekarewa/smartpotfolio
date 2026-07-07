import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

export const TRANSACTION_TYPES = ["deposit", "withdrawal", "income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * Append-only ledger entry. Business income/expense reuses this collection
 * (scoped by businessId) rather than a parallel accounting model.
 */
const transactionSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    // Only set for type "transfer": the other leg of a move between two of
    // the user's own accounts (e.g. an owner draw from a business account
    // into a personal one). accountId is the outgoing side.
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
    billId: { type: Schema.Types.ObjectId, ref: "Bill" },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amountCents: { type: Number, required: true }, // always positive; sign is implied by type
    category: { type: String, trim: true },
    note: { type: String, trim: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

transactionSchema.plugin(userScoped);
transactionSchema.index({ userId: 1, accountId: 1, at: -1 });
transactionSchema.index({ userId: 1, businessId: 1, at: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;

export const Transaction = models.Transaction ?? model("Transaction", transactionSchema);
