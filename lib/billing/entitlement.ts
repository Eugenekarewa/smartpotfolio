import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models";

export const GRACE_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // FR-7.4
export const PREMIUM_PRICE_CENTS = 45000; // 450 KES/month

/**
 * Entitlement is derived from currentPeriodEnd, never a cached boolean
 * (FR-7.3). The one exception is the 2-day grace window (FR-7.4): a
 * lapsed-but-"grace" subscription still counts as premium until the cron
 * in app/api/cron/subscription-grace flips it to "expired".
 */
export async function isPremium(userId: Types.ObjectId): Promise<boolean> {
  await connectToDatabase();
  const sub = await Subscription.findOne({ userId }).lean();
  if (!sub) return false;
  if (sub.status === "expired") return false;

  const graceBufferMs = sub.status === "grace" ? GRACE_PERIOD_MS : 0;
  return sub.currentPeriodEnd.getTime() + graceBufferMs > Date.now();
}

export async function requirePremiumOrResponse(userId: Types.ObjectId): Promise<NextResponse | null> {
  if (await isPremium(userId)) return null;
  return NextResponse.json({ error: "Premium required" }, { status: 403 });
}

const TRIAL_DAYS = 14;

/** 14-day trial on signup, no payment method required. No-op if one already exists. */
export async function startTrialIfNeeded(userId: Types.ObjectId): Promise<void> {
  await connectToDatabase();
  const existing = await Subscription.findOne({ userId }).lean();
  if (existing) return;

  const currentPeriodEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  await Subscription.create({ userId, provider: "intasend", status: "trialing", currentPeriodEnd });
}
