import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${params.to}: ${params.subject}`);
    return;
  }

  await getClient().emails.send({
    from: process.env.EMAIL_FROM ?? "Pesa Command <noreply@pesacommand.co.ke>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
