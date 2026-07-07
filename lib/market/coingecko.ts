/**
 * CoinGecko Demo API (verified 2026-07 against docs.coingecko.com):
 * base https://api.coingecko.com/api/v3, key via x-cg-demo-api-key header.
 * Free tier: 100 calls/min, 10k/month — hourly polling of a fixed coin
 * list is well within budget.
 */
const TRACKED_COINS = ["bitcoin", "ethereum", "tether", "solana", "usd-coin", "binancecoin"] as const;

export interface CryptoPrice {
  coinGeckoId: string;
  usd: number;
  usd24hChangePct: number;
}

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", TRACKED_COINS.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;

  return TRACKED_COINS.filter((id) => data[id]).map((id) => ({
    coinGeckoId: id,
    usd: data[id].usd,
    usd24hChangePct: data[id].usd_24h_change,
  }));
}
