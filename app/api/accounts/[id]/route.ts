import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account } from "@/lib/db/models";
import { updateAccountSchema } from "@/lib/accounts/schemas";
import { getAccountValueCents } from "@/lib/ledger";

export async function PATCH(req: Request, ctx: RouteContext<"/api/accounts/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const account = await Account.findOneAndUpdate(
    { userId, _id: new Types.ObjectId(id) },
    { $set: parsed.data },
    { new: true }
  );

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ account });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/accounts/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const accountId = new Types.ObjectId(id);

  const account = await Account.findOne({ userId, _id: accountId }).lean();
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentValueCents = await getAccountValueCents(userId, accountId);

  return NextResponse.json({ account: { ...account, currentValueCents } });
}
