import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription, User } from "@/lib/db/models";
import { sendEmail } from "@/lib/email/resend";
import { GRACE_PERIOD_MS } from "@/lib/billing/entitlement";

/**
 * Vercel Cron target (daily). Trials lapse straight to "expired" (nothing
 * to retry). Paid subscriptions get a 2-day grace window (FR-7.4): active
 * -> grace immediately on lapse (with a nudge email), grace -> expired
 * once the buffer elapses.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_MS);

  await Subscription.updateMany({ status: "trialing", currentPeriodEnd: { $lt: now } }, { $set: { status: "expired" } });

  const justLapsed = await Subscription.find({ status: "active", currentPeriodEnd: { $lt: now } }).lean();
  await Subscription.updateMany({ status: "active", currentPeriodEnd: { $lt: now } }, { $set: { status: "grace" } });

  let nudged = 0;
  for (const sub of justLapsed) {
    const user = await User.findById(sub.userId).lean();
    if (!user) continue;
    await sendEmail({
      to: user.email,
      subject: "Your Pesa Command Premium renewal didn't go through",
      html: `<p>We couldn't confirm your M-Pesa renewal. Premium stays active for 2 more days — <a href="${process.env.APP_URL}/billing">renew now</a> to avoid losing access.</p>`,
    });
    nudged++;
  }

  const expiredResult = await Subscription.updateMany(
    { status: "grace", currentPeriodEnd: { $lt: graceCutoff } },
    { $set: { status: "expired" } }
  );

  return NextResponse.json({ ok: true, nudged, expired: expiredResult.modifiedCount });
}
