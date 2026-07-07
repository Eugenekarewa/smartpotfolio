import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Transaction } from "@/lib/db/models";
import { ownerDrawSchema } from "@/lib/businesses/schemas";

/**
 * Owner draw (FR-5.3): moves money from a business account to a personal
 * one. A single "transfer" transaction row covers both legs — accountId is
 * the outgoing side, toAccountId the incoming side (see lib/ledger.ts).
 */
export async function POST(req: Request, ctx: RouteContext<"/api/businesses/[id]/owner-draw">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = ownerDrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const businessId = new Types.ObjectId(id);
  const fromAccountId = new Types.ObjectId(parsed.data.fromAccountId);
  const toAccountId = new Types.ObjectId(parsed.data.toAccountId);

  const [fromAccount, toAccount] = await Promise.all([
    Account.findOne({ userId, _id: fromAccountId, businessId }).lean(),
    Account.findOne({ userId, _id: toAccountId }).lean(),
  ]);
  if (!fromAccount) {
    return NextResponse.json({ error: "fromAccountId must be one of this business's accounts" }, { status: 400 });
  }
  if (!toAccount) {
    return NextResponse.json({ error: "toAccountId not found" }, { status: 400 });
  }

  const transaction = await Transaction.create({
    userId,
    accountId: fromAccountId,
    toAccountId,
    businessId,
    type: "transfer",
    amountCents: parsed.data.amountCents,
    category: "Owner draw",
    at: parsed.data.at ? new Date(parsed.data.at) : new Date(),
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
