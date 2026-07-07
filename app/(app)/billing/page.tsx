import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models";
import { isPremium } from "@/lib/billing/entitlement";
import { UpgradeForm } from "./UpgradeForm";
import { CancelButton } from "./CancelButton";

export default async function BillingPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);

  await connectToDatabase();
  const [subscription, premium] = await Promise.all([
    Subscription.findOne({ userId }).lean(),
    isPremium(userId),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm">
          Status: <span className="font-medium">{subscription?.status ?? "none"}</span>
          {premium && " (Premium active)"}
        </p>
        {subscription && (
          <p className="mt-1 text-sm text-neutral-500">
            {subscription.status === "trialing" ? "Trial ends" : "Renews / expires"}{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-KE")}
          </p>
        )}
        {subscription?.cancelAtPeriodEnd && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            Cancels at period end — no further renewal reminders will be sent.
          </p>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upgrade to Premium — 450 KES/month</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Unlocks the market intelligence feed, T-bill/bond auction alerts, MMF yield comparisons, and unlimited
          accounts.
        </p>
        <UpgradeForm />
      </section>

      {premium && !subscription?.cancelAtPeriodEnd && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Cancel</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Premium stays active until {subscription && new Date(subscription.currentPeriodEnd).toLocaleDateString("en-KE")}.
          </p>
          <CancelButton />
        </section>
      )}
    </main>
  );
}
