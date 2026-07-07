import { z } from "zod";
import { MARKET_DATA_KINDS } from "@/lib/db/models/MarketData";
import { NEWS_TOPICS } from "@/lib/db/models/NewsItem";

export const upsertMarketDataSchema = z.object({
  kind: z.enum(MARKET_DATA_KINDS),
  key: z.string().trim().min(1).max(120),
  label: z.string().trim().max(160).optional(),
  value: z.record(z.string(), z.unknown()),
  at: z.string().min(1).optional(),
});

export const createNewsItemSchema = z.object({
  topic: z.enum(NEWS_TOPICS),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  source: z.string().trim().max(120).optional(),
  sourceUrl: z.string().trim().url().optional(),
  publishedAt: z.string().min(1).optional(),
});
