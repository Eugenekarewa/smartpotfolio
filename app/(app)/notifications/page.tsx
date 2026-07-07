import { Types } from "mongoose";
import { auth } from "@/auth";
import { listBills, deriveBillStatus } from "@/lib/bills";
import { isPremium } from "@/lib/billing/entitlement";
import { connectToDatabase } from "@/lib/db/connect";
import { MarketData, NewsItem } from "@/lib/db/models";
import { formatKes } from "@/lib/money";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);
  const premium = await isPremium(userId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [bills, recentNews, recentAuctions] = await Promise.all([
    listBills(userId),
    premium ? NewsItem.find({ publishedAt: { $gte: sevenDaysAgo } }).sort({ publishedAt: -1 }).limit(10).lean() : [],
    premium
      ? (async () => {
          await connectToDatabase();
          return MarketData.find({ kind: { $in: ["tbill_rate", "bond_rate"] }, at: { $gte: sevenDaysAgo } })
            .sort({ at: -1 })
            .limit(10)
            .lean();
        })()
      : [],
  ]);

  const alertBills = bills.filter((b) => deriveBillStatus(b) === "overdue" || deriveBillStatus(b) === "upcoming");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Bills</h2>
        {alertBills.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Nothing needs attention.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {alertBills.map((b) => {
              const status = deriveBillStatus(b);
              return (
                <li key={String(b._id)} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{b.name}</span>
                  <span className={status === "overdue" ? "text-red-600 dark:text-red-400" : "text-neutral-500"}>
                    {formatKes(b.amountCents)} · {status} · {new Date(b.nextDueAt).toLocaleDateString("en-KE")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {premium && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Auction alerts</h2>
            {recentAuctions.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No new auctions this week.</p>
            ) : (
              <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                {recentAuctions.map((a) => (
                  <li key={String(a._id)} className="px-4 py-2 text-sm">
                    {a.label ?? a.key} — {new Date(a.at).toLocaleDateString("en-KE")}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">News</h2>
            {recentNews.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No news this week.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentNews.map((n) => (
                  <li key={String(n._id)} className="rounded-md border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800">
                    {n.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
