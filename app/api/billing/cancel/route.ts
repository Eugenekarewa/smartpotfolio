import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models";

/** Self-serve cancel (FR-7.5): premium persists to period end, so this only suppresses future renewal nudges. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);

  const sub = await Subscription.findOneAndUpdate({ userId }, { $set: { cancelAtPeriodEnd: true } }, { new: true });
  if (!sub) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  return NextResponse.json({ subscription: sub });
}
