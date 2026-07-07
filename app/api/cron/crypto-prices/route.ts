import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MarketData } from "@/lib/db/models";
import { fetchCryptoPrices } from "@/lib/market/coingecko";

/** Vercel Cron target (hourly, FR-6.4). */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prices = await fetchCryptoPrices();
  await connectToDatabase();

  const at = new Date();
  await Promise.all(
    prices.map((p) =>
      MarketData.create({
        kind: "crypto",
        key: p.coinGeckoId,
        label: p.coinGeckoId,
        value: { usd: p.usd, change24hPct: p.usd24hChangePct },
        at,
      })
    )
  );

  return NextResponse.json({ ok: true, updated: prices.length });
}
