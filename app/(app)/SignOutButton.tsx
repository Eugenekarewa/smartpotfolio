"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      Sign out
    </button>
  );
}
