import { Schema, model, models, type InferSchemaType } from "mongoose";
import { userScoped } from "../userScoped";

export const BILL_RECURRENCES = ["one_off", "weekly", "monthly", "custom_dom", "yearly"] as const;
export type BillRecurrence = (typeof BILL_RECURRENCES)[number];

const billSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" }, // e.g. the loan this bill repays
    amountCents: { type: Number, required: true },
    recurrence: { type: String, enum: BILL_RECURRENCES, required: true },
    dayOfMonth: { type: Number, min: 1, max: 31 }, // for custom_dom / monthly
    nextDueAt: { type: Date, required: true },
    status: { type: String, enum: ["upcoming", "overdue", "paid"], default: "upcoming" },
    history: [
      {
        dueAt: { type: Date, required: true },
        paidAt: { type: Date },
        transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
        wasOnTime: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

billSchema.plugin(userScoped);
billSchema.index({ userId: 1, nextDueAt: 1 });

export type BillDoc = InferSchemaType<typeof billSchema>;

export const Bill = models.Bill ?? model("Bill", billSchema);
