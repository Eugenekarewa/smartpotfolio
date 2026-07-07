import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { NewsItem } from "@/lib/db/models";
import { createNewsItemSchema } from "@/lib/market/schemas";

/** Manual news feed curation (PRD §11 Q6: automated-summary vs editorial — starts editorial). Gated like /api/admin/market-data. */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createNewsItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  await connectToDatabase();
  const { topic, title, body: text, source, sourceUrl, publishedAt } = parsed.data;

  const item = await NewsItem.create({
    topic,
    title,
    body: text,
    source,
    sourceUrl,
    publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
  });

  return NextResponse.json({ item }, { status: 201 });
}
