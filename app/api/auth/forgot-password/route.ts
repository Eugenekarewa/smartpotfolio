import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { requestPasswordReset } from "@/lib/auth/passwordReset";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await requestPasswordReset(parsed.data.email);

  // Always return success to avoid leaking which emails are registered.
  return NextResponse.json({ ok: true });
}
