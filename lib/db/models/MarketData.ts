import { Schema, model, models, type InferSchemaType } from "mongoose";

export const MARKET_DATA_KINDS = ["nse_index", "nse_stock", "crypto", "mmf_yield", "tbill_rate", "bond_rate"] as const;
export type MarketDataKind = (typeof MARKET_DATA_KINDS)[number];

/**
 * Global (not user-scoped) market intelligence data, written by the
 * ingestion worker (worker/jobs/*) and read by premium-gated screens.
 */
const marketDataSchema = new Schema(
  {
    kind: { type: String, enum: MARKET_DATA_KINDS, required: true },
    key: { type: String, required: true, trim: true }, // e.g. ticker, fund name, "91-day"
    label: { type: String, trim: true },
    value: { type: Schema.Types.Mixed, required: true }, // shape depends on kind
    at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

marketDataSchema.index({ kind: 1, key: 1, at: -1 });

export type MarketDataDoc = InferSchemaType<typeof marketDataSchema>;

export const MarketData = models.MarketData ?? model("MarketData", marketDataSchema);
