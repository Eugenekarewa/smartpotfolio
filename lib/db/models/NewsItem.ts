import { Schema, model, models, type InferSchemaType } from "mongoose";

export const NEWS_TOPICS = ["nse", "mmf", "tbill_bond", "crypto", "sacco", "general"] as const;
export type NewsTopic = (typeof NEWS_TOPICS)[number];

const newsItemSchema = new Schema(
  {
    topic: { type: String, enum: NEWS_TOPICS, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    source: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

newsItemSchema.index({ topic: 1, publishedAt: -1 });

export type NewsItemDoc = InferSchemaType<typeof newsItemSchema>;

export const NewsItem = models.NewsItem ?? model("NewsItem", newsItemSchema);
