export interface StkPushParams {
  phoneNumber: string; // 2547XXXXXXXX
  amountCents: number;
  reference: string;
  name: string;
  email: string;
}

export interface StkPushResult {
  invoiceId: string;
  state: string;
}

export interface PaymentWebhookEvent {
  invoiceId: string;
  apiRef: string | null;
  state: string;
  raw: unknown;
}

/**
 * Swappable payment backend (PRD §11 leaves the provider open). Billing
 * logic in this directory talks only to this interface, so switching to
 * Paystack later is a new adapter, not a rewrite.
 */
export interface PaymentProvider {
  initiateStkPush(params: StkPushParams): Promise<StkPushResult>;
  parseWebhookEvent(body: Record<string, unknown>): PaymentWebhookEvent;
  isWebhookChallengeValid(body: Record<string, unknown>): boolean;
}
