import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Account, Valuation } from "@/lib/db/models";
import { createAccountSchema } from "@/lib/accounts/schemas";
import { listAccountsWithValues } from "@/lib/ledger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new Types.ObjectId(session.user.id);
  const accounts = await listAccountsWithValues(userId);

  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, type, initialValueCents, costBasisCents, businessId, meta } = parsed.data;

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const account = await Account.create({
    userId,
    name,
    type,
    costBasisCents: costBasisCents ?? initialValueCents,
    businessId: businessId ? new Types.ObjectId(businessId) : undefined,
    meta: meta
      ? {
          ...meta,
          maturityDate: meta.maturityDate ? new Date(meta.maturityDate) : undefined,
        }
      : undefined,
  });

  await Valuation.create({
    userId,
    accountId: account._id,
    valueCents: initialValueCents,
    at: new Date(),
    source: "manual",
  });

  return NextResponse.json({ account }, { status: 201 });
}
