import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Valuation } from "@/lib/db/models";
import { addValuationSchema } from "@/lib/accounts/schemas";

export async function GET(_req: Request, ctx: RouteContext<"/api/accounts/[id]/valuations">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const accountId = new Types.ObjectId(id);

  const valuations = await Valuation.find({ userId, accountId }).sort({ at: 1 }).lean();

  return NextResponse.json({ valuations });
}

export async function POST(req: Request, ctx: RouteContext<"/api/accounts/[id]/valuations">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = addValuationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const accountId = new Types.ObjectId(id);

  const account = await Account.findOne({ userId, _id: accountId }).lean();
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const valuation = await Valuation.create({
    userId,
    accountId,
    valueCents: parsed.data.valueCents,
    at: parsed.data.at ? new Date(parsed.data.at) : new Date(),
    source: "manual",
  });

  return NextResponse.json({ valuation }, { status: 201 });
}
