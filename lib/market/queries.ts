import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { MarketData, Account, NewsItem, type MarketDataKind, type NewsTopic } from "@/lib/db/models";

export async function getLatestByKind(kind: MarketDataKind) {
  await connectToDatabase();
  return MarketData.aggregate([
    { $match: { kind } },
    { $sort: { at: -1 } },
    { $group: { _id: "$key", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { key: 1 } },
  ]);
}

export async function getNewsFeed(topic?: NewsTopic, limit = 20) {
  await connectToDatabase();
  const filter = topic ? { topic } : {};
  return NewsItem.find(filter).sort({ publishedAt: -1 }).limit(limit).lean();
}

/** "vs your fund" comparison (FR-6.3): matches the user's MMF accounts to yield entries by name. */
export async function getMmfComparisonForUser(userId: Types.ObjectId) {
  await connectToDatabase();
  const [mmfYields, userMmfAccounts] = await Promise.all([
    getLatestByKind("mmf_yield"),
    Account.find({ userId, type: "mmf", archived: false }).lean(),
  ]);

  return userMmfAccounts.map((account) => {
    const nameLower = account.name.toLowerCase();
    const match = mmfYields.find((y) => {
      const keyLower = String(y.key).toLowerCase();
      return nameLower.includes(keyLower) || keyLower.includes(nameLower);
    });
    const value = match?.value as { annualYieldPct?: number } | undefined;

    return {
      accountName: account.name,
      yourYieldPct: value?.annualYieldPct ?? null,
      matchedFund: match ? (match.label ?? match.key) : null,
    };
  });
}
