import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { PaymentEvent, Subscription, User } from "@/lib/db/models";
import { intasendProvider } from "@/lib/billing/intasend";
import { sendEmail } from "@/lib/email/resend";
import { formatKes } from "@/lib/money";
import { PREMIUM_PRICE_CENTS } from "@/lib/billing/entitlement";

const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function userIdFromApiRef(apiRef: string | null): string | null {
  // api_ref format: sub_<userId>_<timestamp>, set in app/api/billing/upgrade
  if (!apiRef) return null;
  const parts = apiRef.split("_");
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Client-reported payment status is never trusted (FR-7.2) — only this
 * signed webhook, deduplicated on IntaSend's invoice_id, moves a
 * subscription to "active".
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !intasendProvider.isWebhookChallengeValid(body)) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const event = intasendProvider.parseWebhookEvent(body);
  if (!event.invoiceId) {
    return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
  }

  await connectToDatabase();

  const rawUserId = userIdFromApiRef(event.apiRef);
  const userId = rawUserId && Types.ObjectId.isValid(rawUserId) ? new Types.ObjectId(rawUserId) : undefined;

  try {
    await PaymentEvent.create({ provider: "intasend", eventId: event.invoiceId, userId, raw: event.raw });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }

  if (event.state === "COMPLETE" && userId) {
    const sub = await Subscription.findOne({ userId });
    if (sub) {
      const base = sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
      sub.currentPeriodEnd = new Date(base.getTime() + SUBSCRIPTION_PERIOD_MS);
      sub.status = "active";
      sub.cancelAtPeriodEnd = false;
      await sub.save();

      const user = await User.findById(userId).lean();
      if (user) {
        await sendEmail({
          to: user.email,
          subject: "Payment received — Pesa Command Premium",
          html: `<p>We received your payment of ${formatKes(PREMIUM_PRICE_CENTS)}. Premium is active until ${sub.currentPeriodEnd.toLocaleDateString("en-KE")}.</p>`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
