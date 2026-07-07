import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { User, Account, Valuation, Transaction, Bill, Business, Subscription } from "@/lib/db/models";

/** Download-my-data (FR-9.2, DPA) — a full JSON dump of every user-scoped record, for all users. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const [user, accounts, valuations, transactions, bills, businesses, subscription] = await Promise.all([
    User.findById(userId).select("-passwordHash").lean(),
    Account.find({ userId }).lean(),
    Valuation.find({ userId }).lean(),
    Transaction.find({ userId }).lean(),
    Bill.find({ userId }).lean(),
    Business.find({ userId }).lean(),
    Subscription.findOne({ userId }).lean(),
  ]);

  const data = { exportedAt: new Date().toISOString(), user, accounts, valuations, transactions, bills, businesses, subscription };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="pesa-command-data-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
