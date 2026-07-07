import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Transaction } from "@/lib/db/models";
import { addBusinessTransactionSchema } from "@/lib/businesses/schemas";

export async function GET(_req: Request, ctx: RouteContext<"/api/businesses/[id]/transactions">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const transactions = await Transaction.find({ userId, businessId: new Types.ObjectId(id) })
    .sort({ at: -1 })
    .lean();

  return NextResponse.json({ transactions });
}

export async function POST(req: Request, ctx: RouteContext<"/api/businesses/[id]/transactions">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = addBusinessTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const businessId = new Types.ObjectId(id);
  const accountId = new Types.ObjectId(parsed.data.accountId);

  const account = await Account.findOne({ userId, _id: accountId, businessId }).lean();
  if (!account) {
    return NextResponse.json({ error: "Account does not belong to this business" }, { status: 400 });
  }

  const transaction = await Transaction.create({
    userId,
    accountId,
    businessId,
    type: parsed.data.type,
    amountCents: parsed.data.amountCents,
    category: parsed.data.category,
    note: parsed.data.note,
    at: parsed.data.at ? new Date(parsed.data.at) : new Date(),
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
