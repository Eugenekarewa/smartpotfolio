import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Bill, User } from "@/lib/db/models";
import { sendEmail } from "@/lib/email/resend";
import { formatKes } from "@/lib/money";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Vercel Cron target (daily). Two jobs in one pass: flip stale "upcoming"
 * bills whose due date has passed to "overdue" (FR-4.4), then email T-3 and
 * due-today reminders (FR-4.2).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();

  await Bill.updateMany({ status: "upcoming", nextDueAt: { $lt: startOfDay(now) } }, { $set: { status: "overdue" } });

  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);

  const dueBills = await Bill.find({
    status: { $ne: "paid" },
    $or: [
      { nextDueAt: { $gte: startOfDay(in3Days), $lte: endOfDay(in3Days) } },
      { nextDueAt: { $gte: startOfDay(now), $lte: endOfDay(now) } },
    ],
  }).lean();

  let sent = 0;
  for (const bill of dueBills) {
    const user = await User.findById(bill.userId).lean();
    if (!user) continue;

    const isToday = startOfDay(new Date(bill.nextDueAt)).getTime() === startOfDay(now).getTime();
    await sendEmail({
      to: user.email,
      subject: isToday ? `${bill.name} is due today` : `${bill.name} is due in 3 days`,
      html: `<p><strong>${bill.name}</strong> — ${formatKes(bill.amountCents)} is due ${
        isToday ? "today" : "in 3 days"
      } (${new Date(bill.nextDueAt).toLocaleDateString("en-KE")}).</p>`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
