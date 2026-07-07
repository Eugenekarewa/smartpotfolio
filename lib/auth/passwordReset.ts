import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { PasswordResetToken, User } from "@/lib/db/models";
import { sendEmail } from "@/lib/email/resend";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string): Promise<void> {
  await connectToDatabase();
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always behave the same whether or not the account exists, to avoid
  // leaking which emails are registered.
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Pesa Command password",
    html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
  await connectToDatabase();
  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;

  await User.findByIdAndUpdate(record.userId, { passwordHash: newPasswordHash });
  record.usedAt = new Date();
  await record.save();

  return true;
}
