import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Bill } from "@/lib/db/models";
import { createBillSchema } from "@/lib/bills/schemas";
import { listBills } from "@/lib/bills";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new Types.ObjectId(session.user.id);
  const bills = await listBills(userId);

  return NextResponse.json({ bills });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, accountId, amountCents, recurrence, dayOfMonth, firstDueAt } = parsed.data;

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const bill = await Bill.create({
    userId,
    name,
    accountId: accountId ? new Types.ObjectId(accountId) : undefined,
    amountCents,
    recurrence,
    dayOfMonth,
    nextDueAt: new Date(firstDueAt),
    status: "upcoming",
  });

  return NextResponse.json({ bill }, { status: 201 });
}
