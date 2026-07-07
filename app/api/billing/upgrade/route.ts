import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models";
import { intasendProvider } from "@/lib/billing/intasend";
import { upgradeSchema } from "@/lib/billing/schemas";
import { PREMIUM_PRICE_CENTS } from "@/lib/billing/entitlement";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upgradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const userId = new Types.ObjectId(session.user.id);
  const reference = `sub_${userId.toString()}_${Date.now()}`;

  const result = await intasendProvider.initiateStkPush({
    phoneNumber: parsed.data.phoneNumber,
    amountCents: PREMIUM_PRICE_CENTS,
    reference,
    name: session.user.name ?? session.user.email,
    email: session.user.email,
  });

  await connectToDatabase();
  await Subscription.findOneAndUpdate(
    { userId },
    { $set: { mpesaNumber: parsed.data.phoneNumber }, $setOnInsert: { provider: "intasend", status: "trialing", currentPeriodEnd: new Date() } },
    { upsert: true }
  );

  return NextResponse.json({ invoiceId: result.invoiceId, state: result.state });
}
