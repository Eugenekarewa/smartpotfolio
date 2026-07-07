import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Pesa Command</h1>
      <p className="max-w-md text-neutral-500">
        Your net worth, cash flow, bills, and business finances in one place — built for the Kenyan market.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
