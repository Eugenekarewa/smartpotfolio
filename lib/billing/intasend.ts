import type { PaymentProvider, StkPushParams, StkPushResult, PaymentWebhookEvent } from "./provider";

/**
 * IntaSend M-Pesa STK push (collection API). Verified against
 * developers.intasend.com/docs/m-pesa-stk-push in 2026-07: the collection
 * endpoint authenticates via public_key in the JSON body (no bearer
 * header), and webhooks authenticate via a shared "challenge" string
 * rather than an HMAC signature.
 */
function baseUrl(): string {
  return process.env.INTASEND_TEST_MODE === "false" ? "https://payment.intasend.com" : "https://sandbox.intasend.com";
}

async function initiateStkPush({ phoneNumber, amountCents, reference, name, email }: StkPushParams): Promise<StkPushResult> {
  const publicKey = process.env.INTASEND_PUBLISHABLE_KEY;
  if (!publicKey) throw new Error("INTASEND_PUBLISHABLE_KEY is not set");

  const res = await fetch(`${baseUrl()}/api/v1/payment/collection/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key: publicKey,
      currency: "KES",
      method: "M-PESA",
      amount: (amountCents / 100).toFixed(2),
      api_ref: reference,
      name,
      email,
      phone_number: phoneNumber,
    }),
  });

  if (!res.ok) {
    throw new Error(`IntaSend STK push failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { invoice: { invoice_id: string; state: string } };
  return { invoiceId: data.invoice.invoice_id, state: data.invoice.state };
}

function parseWebhookEvent(body: Record<string, unknown>): PaymentWebhookEvent {
  return {
    invoiceId: String(body.invoice_id ?? ""),
    apiRef: body.api_ref ? String(body.api_ref) : null,
    state: String(body.state ?? "PENDING"),
    raw: body,
  };
}

function isWebhookChallengeValid(body: Record<string, unknown>): boolean {
  const expected = process.env.INTASEND_WEBHOOK_SECRET;
  if (!expected) return false;
  return body.challenge === expected;
}

export const intasendProvider: PaymentProvider = {
  initiateStkPush,
  parseWebhookEvent,
  isWebhookChallengeValid,
};
