import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { signupSchema } from "@/lib/auth/schemas";
import { startTrialIfNeeded } from "@/lib/billing/entitlement";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    // Same response shape as success, to avoid leaking which emails are registered.
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  await startTrialIfNeeded(user._id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
