import Link from "next/link";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { isPremium } from "@/lib/billing/entitlement";
import { getLatestByKind, getMmfComparisonForUser, getNewsFeed } from "@/lib/market/queries";
import { InfoDisclosure } from "./InfoDisclosure";

const TOPIC_LABELS: Record<string, string> = {
  nse: "NSE",
  mmf: "MMF",
  tbill_bond: "T-Bills & Bonds",
  crypto: "Crypto",
  sacco: "SACCO",
  general: "General",
};

export default async function MarketPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);
  const premium = await isPremium(userId);

  if (!premium) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold">Market Intelligence</h1>
        <p className="mt-3 text-sm text-neutral-500">
          NSE movers, CBK T-bill/bond auction alerts, MMF yield comparisons, and crypto prices are a Premium
          feature.
        </p>
        <Link
          href="/billing"
          className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Upgrade to Premium
        </Link>
      </main>
    );
  }

  const [cryptoPrices, mmfYields, tbillRates, bondRates, mmfComparison, news] = await Promise.all([
    getLatestByKind("crypto"),
    getLatestByKind("mmf_yield"),
    getLatestByKind("tbill_rate"),
    getLatestByKind("bond_rate"),
    getMmfComparisonForUser(userId),
    getNewsFeed(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Market Intelligence</h1>
      <div className="mt-3">
        <InfoDisclosure />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Crypto</h2>
        {cryptoPrices.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No price data yet.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cryptoPrices.map((c) => {
              const value = c.value as { usd: number; change24hPct: number };
              return (
                <li key={c.key} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                  <p className="text-xs uppercase text-neutral-500">{c.label ?? c.key}</p>
                  <p className="mt-1 text-sm font-semibold">${value.usd.toLocaleString()}</p>
                  <p className={`text-xs ${value.change24hPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {value.change24hPct >= 0 ? "+" : ""}
                    {value.change24hPct.toFixed(1)}% (24h)
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">MMF yields</h2>
        {mmfYields.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No yield data yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {mmfYields.map((y) => {
              const value = y.value as { annualYieldPct: number };
              return (
                <li key={y.key} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{y.label ?? y.key}</span>
                  <span>{value.annualYieldPct.toFixed(2)}%</span>
                </li>
              );
            })}
          </ul>
        )}

        {mmfComparison.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium">Vs. your funds</h3>
            <ul className="mt-2 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {mmfComparison.map((c) => (
                <li key={c.accountName} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{c.accountName}</span>
                  <span>
                    {c.yourYieldPct !== null
                      ? `${c.yourYieldPct.toFixed(2)}% (matched: ${c.matchedFund})`
                      : "No match yet"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">T-Bills & Bonds</h2>
        {tbillRates.length === 0 && bondRates.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No auction data yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {[...tbillRates, ...bondRates].map((r) => {
              const value = r.value as { ratePct: number; auctionDate?: string };
              return (
                <li key={`${r.kind}-${r.key}`} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{r.label ?? r.key}</span>
                  <span>
                    {value.ratePct.toFixed(2)}% {value.auctionDate ? `· ${value.auctionDate}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">News</h2>
        {news.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No news yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {news.map((n) => (
              <li key={String(n._id)} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                <p className="text-xs uppercase text-neutral-500">{TOPIC_LABELS[n.topic] ?? n.topic}</p>
                <p className="mt-1 text-sm font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
