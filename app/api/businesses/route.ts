import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Business } from "@/lib/db/models";
import { createBusinessSchema } from "@/lib/businesses/schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const businesses = await Business.find({ userId, archived: false }).sort({ createdAt: 1 }).lean();

  return NextResponse.json({ businesses });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectToDatabase();
  const userId = new Types.ObjectId(session.user.id);
  const business = await Business.create({ userId, name: parsed.data.name });

  return NextResponse.json({ business }, { status: 201 });
}
