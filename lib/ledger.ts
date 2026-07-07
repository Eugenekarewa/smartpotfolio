import { Types } from "mongoose";
import { connectToDatabase } from "./db/connect";
import { Account, Valuation, Transaction } from "./db/models";
import { addCents } from "./money";

const LIQUID_ACCOUNT_TYPES = new Set(["cash", "mmf", "sacco"]);
const LIABILITY_ACCOUNT_TYPES = new Set(["loan"]);

/**
 * Current value of an account is derived, never stored as a mutable total:
 * latest valuation snapshot, plus any deposit/withdrawal transactions
 * recorded after that snapshot (so a quick deposit doesn't require an
 * immediate manual re-valuation to stay accurate).
 */
export async function getAccountValueCents(
  userId: Types.ObjectId,
  accountId: Types.ObjectId,
  asOf: Date = new Date()
): Promise<number> {
  await connectToDatabase();

  const latestValuation = await Valuation.findOne({ userId, accountId, at: { $lte: asOf } })
    .sort({ at: -1 })
    .lean();
  const since = latestValuation?.at ?? new Date(0);
  const baseValueCents = latestValuation?.valueCents ?? 0;

  const movements = await Transaction.find({
    userId,
    at: { $gt: since, $lte: asOf },
    $or: [
      { accountId, type: { $in: ["deposit", "withdrawal", "income", "expense", "transfer"] } },
      { toAccountId: accountId, type: "transfer" },
    ],
  }).lean();

  const netMovementCents = addCents(
    ...movements.map((tx) => {
      const isIncomingTransfer = tx.type === "transfer" && String(tx.toAccountId) === String(accountId);
      if (isIncomingTransfer) return tx.amountCents;
      if (tx.type === "deposit" || tx.type === "income") return tx.amountCents;
      return -tx.amountCents; // withdrawal, expense, or the outgoing side of a transfer
    })
  );

  return baseValueCents + netMovementCents;
}

export async function listAccountsWithValues(userId: Types.ObjectId, businessId?: Types.ObjectId) {
  await connectToDatabase();

  const filter: Record<string, unknown> = { userId, archived: false };
  if (businessId) filter.businessId = businessId;

  const accounts = await Account.find(filter).sort({ createdAt: 1 }).lean();

  return Promise.all(
    accounts.map(async (account) => ({
      ...account,
      currentValueCents: await getAccountValueCents(userId, account._id),
    }))
  );
}

export async function getNetWorthCents(
  userId: Types.ObjectId,
  asOf: Date = new Date()
): Promise<{
  netWorthCents: number;
  assetsCents: number;
  liabilitiesCents: number;
  liquidCents: number;
}> {
  await connectToDatabase();

  const accounts = await Account.find({ userId, archived: false }).lean();
  const values = await Promise.all(
    accounts.map(async (account) => ({
      type: account.type as string,
      valueCents: await getAccountValueCents(userId, account._id, asOf),
    }))
  );

  let assetsCents = 0;
  let liabilitiesCents = 0;
  let liquidCents = 0;

  for (const { type, valueCents } of values) {
    if (LIABILITY_ACCOUNT_TYPES.has(type)) {
      liabilitiesCents += valueCents;
    } else {
      assetsCents += valueCents;
      if (LIQUID_ACCOUNT_TYPES.has(type)) {
        liquidCents += valueCents;
      }
    }
  }

  return {
    netWorthCents: assetsCents - liabilitiesCents,
    assetsCents,
    liabilitiesCents,
    liquidCents,
  };
}

export async function getCashFlowCents(
  userId: Types.ObjectId,
  monthStart: Date,
  monthEnd: Date
): Promise<{ incomeCents: number; expenseCents: number; netCents: number }> {
  await connectToDatabase();

  const txs = await Transaction.find({
    userId,
    type: { $in: ["income", "expense"] },
    at: { $gte: monthStart, $lt: monthEnd },
  }).lean();

  const incomeCents = addCents(...txs.filter((t) => t.type === "income").map((t) => t.amountCents));
  const expenseCents = addCents(...txs.filter((t) => t.type === "expense").map((t) => t.amountCents));

  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

/**
 * Cash runway = liquid cash / average monthly burn (FR-2.4), using the
 * trailing 3 months of expense transactions.
 */
export async function getCashRunwayMonths(userId: Types.ObjectId): Promise<number | null> {
  await connectToDatabase();

  const { liquidCents } = await getNetWorthCents(userId);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await Transaction.find({
    userId,
    type: "expense",
    at: { $gte: threeMonthsAgo },
  }).lean();

  const totalExpenseCents = addCents(...expenses.map((t) => t.amountCents));
  const avgMonthlyBurnCents = totalExpenseCents / 3;

  if (avgMonthlyBurnCents <= 0) {
    return null; // no burn history yet — runway is undefined, not infinite
  }

  return liquidCents / avgMonthlyBurnCents;
}

export async function getBusinessProfitAndLossCents(
  userId: Types.ObjectId,
  businessId: Types.ObjectId,
  monthStart: Date,
  monthEnd: Date
): Promise<{ incomeCents: number; expenseCents: number; netCents: number }> {
  await connectToDatabase();

  const txs = await Transaction.find({
    userId,
    businessId,
    type: { $in: ["income", "expense"] },
    at: { $gte: monthStart, $lt: monthEnd },
  }).lean();

  const incomeCents = addCents(...txs.filter((t) => t.type === "income").map((t) => t.amountCents));
  const expenseCents = addCents(...txs.filter((t) => t.type === "expense").map((t) => t.amountCents));

  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

/** Trailing N months of P&L (FR-5.2), oldest first. */
export async function getBusinessProfitAndLossTrend(userId: Types.ObjectId, businessId: Types.ObjectId, months = 6) {
  const now = new Date();
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const pnl = await getBusinessProfitAndLossCents(userId, businessId, monthStart, monthEnd);
    results.push({ month: monthStart.toISOString().slice(0, 7), ...pnl });
  }

  return results;
}
