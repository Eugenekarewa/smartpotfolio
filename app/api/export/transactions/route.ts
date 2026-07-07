import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { requirePremiumOrResponse } from "@/lib/billing/entitlement";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Transaction } from "@/lib/db/models";
import { centsToKes } from "@/lib/money";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toRow(fields: string[]): string {
  return fields.map(csvEscape).join(",") + "\r\n";
}

/** CSV export of transaction history (FR-9.1, premium). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new Types.ObjectId(session.user.id);
  const gate = await requirePremiumOrResponse(userId);
  if (gate) return gate;

  await connectToDatabase();
  const [accounts, transactions] = await Promise.all([
    Account.find({ userId }).lean(),
    Transaction.find({ userId }).sort({ at: 1 }).lean(),
  ]);
  const accountNames = new Map(accounts.map((a) => [String(a._id), a.name]));

  let csv = toRow(["Date", "Account", "Type", "Amount (KES)", "Category", "Note"]);
  for (const tx of transactions) {
    csv += toRow([
      new Date(tx.at).toISOString().slice(0, 10),
      accountNames.get(String(tx.accountId)) ?? "",
      tx.type,
      centsToKes(tx.amountCents).toFixed(2),
      tx.category ?? "",
      tx.note ?? "",
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pesa-command-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
