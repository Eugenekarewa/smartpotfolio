import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription, User } from "@/lib/db/models";
import { getNetWorthCents } from "@/lib/ledger";
import { getUpcomingBills } from "@/lib/bills";
import { formatKes } from "@/lib/money";
import { sendEmail } from "@/lib/email/resend";

/** Vercel Cron target (weekly, premium-only per FR-8.1). */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const premiumSubs = await Subscription.find({ currentPeriodEnd: { $gt: new Date() } }).lean();

  let sent = 0;
  for (const sub of premiumSubs) {
    const user = await User.findById(sub.userId).lean();
    if (!user) continue;

    const [netWorth, upcomingBills] = await Promise.all([
      getNetWorthCents(sub.userId),
      getUpcomingBills(sub.userId, 7),
    ]);

    const billsHtml =
      upcomingBills.length > 0
        ? `<ul>${upcomingBills.map((b) => `<li>${b.name} — ${formatKes(b.amountCents)} due ${new Date(b.nextDueAt).toLocaleDateString("en-KE")}</li>`).join("")}</ul>`
        : "<p>No bills due in the next 7 days.</p>";

    await sendEmail({
      to: user.email,
      subject: "Your weekly Pesa Command digest",
      html: `<p>Net worth: <strong>${formatKes(netWorth.netWorthCents)}</strong></p><p>Bills due this week:</p>${billsHtml}`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
