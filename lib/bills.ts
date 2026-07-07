import { Types } from "mongoose";
import { connectToDatabase } from "./db/connect";
import { Bill, Transaction, type BillRecurrence } from "./db/models";

export async function getUpcomingBills(userId: Types.ObjectId, days = 14) {
  await connectToDatabase();

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + days);

  return Bill.find({
    userId,
    status: { $ne: "paid" },
    nextDueAt: { $lte: horizon },
  })
    .sort({ nextDueAt: 1 })
    .lean();
}

export async function listBills(userId: Types.ObjectId) {
  await connectToDatabase();
  return Bill.find({ userId }).sort({ nextDueAt: 1 }).lean();
}

/** "paid" (one-off, fully settled) vs the stored status, which can go stale between due-date crossings. */
export function deriveBillStatus(bill: { status: string; nextDueAt: Date | string }): "upcoming" | "overdue" | "paid" {
  if (bill.status === "paid") return "paid";
  return new Date(bill.nextDueAt) < new Date() ? "overdue" : "upcoming";
}

function clampDayOfMonth(year: number, monthIndex: number, day: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}

/**
 * Rolls a due date forward per the bill's recurrence rule (FR-4.1). Returns
 * null for one-off bills — there is no next occurrence.
 */
export function computeNextDueDate(current: Date, recurrence: BillRecurrence, dayOfMonth?: number): Date | null {
  switch (recurrence) {
    case "one_off":
      return null;
    case "weekly": {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    }
    case "monthly": {
      const day = dayOfMonth ?? current.getDate();
      const year = current.getFullYear();
      const nextMonthIndex = current.getMonth() + 1;
      return new Date(year, nextMonthIndex, clampDayOfMonth(year, nextMonthIndex, day));
    }
    case "custom_dom": {
      if (!dayOfMonth) throw new Error("custom_dom recurrence requires dayOfMonth");
      const year = current.getFullYear();
      const nextMonthIndex = current.getMonth() + 1;
      return new Date(year, nextMonthIndex, clampDayOfMonth(year, nextMonthIndex, dayOfMonth));
    }
    case "yearly": {
      const next = new Date(current);
      next.setFullYear(next.getFullYear() + 1);
      return next;
    }
  }
}

/**
 * Marks the current due occurrence paid (FR-4.3): records an expense
 * transaction when an account is given, appends payment history, and
 * advances nextDueAt per the recurrence rule.
 */
export async function markBillPaid(
  userId: Types.ObjectId,
  billId: Types.ObjectId,
  opts: { accountId?: Types.ObjectId; paidAt?: Date } = {}
) {
  await connectToDatabase();

  const bill = await Bill.findOne({ userId, _id: billId });
  if (!bill) throw new Error("Bill not found");

  const paidAt = opts.paidAt ?? new Date();
  const dueAt = bill.nextDueAt;
  const wasOnTime = paidAt <= dueAt;

  let transactionId: Types.ObjectId | undefined;
  if (opts.accountId) {
    const transaction = await Transaction.create({
      userId,
      accountId: opts.accountId,
      billId: bill._id,
      type: "expense",
      amountCents: bill.amountCents,
      category: bill.name,
      at: paidAt,
    });
    transactionId = transaction._id;
  }

  bill.history.push({ dueAt, paidAt, transactionId, wasOnTime });

  const nextDueAt = computeNextDueDate(dueAt, bill.recurrence as BillRecurrence, bill.dayOfMonth ?? undefined);
  if (nextDueAt) {
    bill.nextDueAt = nextDueAt;
    bill.status = "upcoming";
  } else {
    bill.status = "paid";
  }

  await bill.save();
  return bill;
}
