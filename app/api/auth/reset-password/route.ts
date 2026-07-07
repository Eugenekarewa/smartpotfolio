import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/auth/schemas";
import { resetPassword } from "@/lib/auth/passwordReset";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const ok = await resetPassword(parsed.data.token, passwordHash);

  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
