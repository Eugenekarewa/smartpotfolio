import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Bill } from "@/lib/db/models";
import { updateBillSchema } from "@/lib/bills/schemas";

export async function PATCH(req: Request, ctx: RouteContext<"/api/bills/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const bill = await Bill.findOneAndUpdate({ userId, _id: new Types.ObjectId(id) }, { $set: parsed.data }, { new: true });
  if (!bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ bill });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/bills/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const bill = await Bill.findOneAndDelete({ userId, _id: new Types.ObjectId(id) });
  if (!bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
