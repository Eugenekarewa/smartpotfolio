import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MarketData } from "@/lib/db/models";
import { upsertMarketDataSchema } from "@/lib/market/schemas";

/**
 * Manual override for CBK T-bill/bond auctions and MMF yields (PRD §10
 * risk mitigation: "manual override tooling for admin" — there is no
 * reliable CBK API/CSV feed to scrape, confirmed 2026-07). Gated on
 * CRON_SECRET as a stand-in for real admin auth, which should replace
 * this before launch.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertMarketDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  await connectToDatabase();
  const { kind, key, label, value, at } = parsed.data;

  const entry = await MarketData.create({
    kind,
    key,
    label,
    value,
    at: at ? new Date(at) : new Date(),
  });

  return NextResponse.json({ entry }, { status: 201 });
}
