import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/accounts" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Accounts
            </Link>
            <Link href="/bills" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Bills
            </Link>
            <Link href="/businesses" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Businesses
            </Link>
            <Link href="/billing" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Billing
            </Link>
            <Link href="/market" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Market
            </Link>
            <Link href="/notifications" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Notifications
            </Link>
            <Link href="/settings" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
              Settings
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
