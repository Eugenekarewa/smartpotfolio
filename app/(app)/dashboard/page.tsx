import Link from "next/link";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { getNetWorthCents, getCashFlowCents, getCashRunwayMonths } from "@/lib/ledger";
import { getUpcomingBills } from "@/lib/bills";
import { formatKes } from "@/lib/money";
import { isPremium } from "@/lib/billing/entitlement";
import { getLatestByKind } from "@/lib/market/queries";

export default async function DashboardPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [netWorth, netWorthStartOfMonth, cashFlow, runwayMonths, upcomingBills, premium] = await Promise.all([
    getNetWorthCents(userId),
    getNetWorthCents(userId, startOfMonth),
    getCashFlowCents(userId, startOfMonth, startOfNextMonth),
    getCashRunwayMonths(userId),
    getUpcomingBills(userId, 14),
    isPremium(userId),
  ]);

  const [btcPrice, mmfYields, tbillRates] = premium
    ? await Promise.all([getLatestByKind("crypto"), getLatestByKind("mmf_yield"), getLatestByKind("tbill_rate")])
    : [[], [], []];

  const btc = btcPrice.find((c) => c.key === "bitcoin")?.value as { usd: number } | undefined;
  const topMmfYield = mmfYields
    .map((y) => (y.value as { annualYieldPct: number }).annualYieldPct)
    .sort((a, b) => b - a)[0];
  const latestTbillRate = tbillRates[0]?.value as { ratePct: number } | undefined;

  const momDeltaCents = netWorth.netWorthCents - netWorthStartOfMonth.netWorthCents;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Welcome, {session?.user?.name ?? "there"}</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net worth"
          value={formatKes(netWorth.netWorthCents)}
          sub={`${momDeltaCents >= 0 ? "+" : ""}${formatKes(momDeltaCents)} this month`}
          subTone={momDeltaCents >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Cash flow (this month)"
          value={formatKes(cashFlow.netCents)}
          sub={`${formatKes(cashFlow.incomeCents)} in / ${formatKes(cashFlow.expenseCents)} out`}
        />
        <StatCard
          label="Cash runway"
          value={runwayMonths === null ? "—" : `${runwayMonths.toFixed(1)} months`}
          sub="liquid cash ÷ avg monthly burn"
        />
        <StatCard label="Assets vs liabilities" value={formatKes(netWorth.assetsCents)} sub={`− ${formatKes(netWorth.liabilitiesCents)} liabilities`} />
      </div>

      {premium && (btc || topMmfYield !== undefined || latestTbillRate) && (
        <div className="mt-4 flex flex-wrap gap-4 rounded-md border border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-800">
          {btc && <span>BTC ${btc.usd.toLocaleString()}</span>}
          {topMmfYield !== undefined && <span>Top MMF {topMmfYield.toFixed(2)}%</span>}
          {latestTbillRate && <span>T-Bill {latestTbillRate.ratePct.toFixed(2)}%</span>}
          <Link href="/market" className="ml-auto hover:underline">
            View market intel →
          </Link>
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming bills (next 14 days)</h2>
        </div>
        {upcomingBills.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Nothing due. Add bills to get reminders here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {upcomingBills.map((bill) => (
              <li key={String(bill._id)} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{bill.name}</span>
                <span className="text-neutral-500">
                  {formatKes(bill.amountCents)} · due {new Date(bill.nextDueAt).toLocaleDateString("en-KE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <Link
          href="/accounts"
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Manage accounts
        </Link>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub: string;
  subTone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p
        className={`mt-1 text-xs ${
          subTone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : subTone === "negative"
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-500"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}
