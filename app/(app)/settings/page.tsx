import { Types } from "mongoose";
import Link from "next/link";
import { auth } from "@/auth";
import { isPremium } from "@/lib/billing/entitlement";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function SettingsPage() {
  const session = await auth();
  const userId = new Types.ObjectId(session!.user!.id);
  const premium = await isPremium(userId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Export data</h2>
        <p className="mt-1 text-sm text-neutral-500">Download your own data at any time.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="/api/export/data"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Download my data (JSON)
          </a>
          {premium ? (
            <a
              href="/api/export/transactions"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Export transactions (CSV)
            </a>
          ) : (
            <Link href="/billing" className="self-center text-sm text-neutral-500 hover:underline">
              CSV export is a Premium feature — upgrade →
            </Link>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Danger zone</h2>
        <div className="mt-3">
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}
