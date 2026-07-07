import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config, used by middleware.ts. Must not
 * import anything that touches Mongoose/Node APIs — the Edge Runtime
 * doesn't support them. Full config (providers, DB-backed callbacks)
 * lives in auth.ts and only runs in the Node.js runtime (API routes,
 * server components).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = [
        "/dashboard",
        "/accounts",
        "/bills",
        "/businesses",
        "/billing",
        "/market",
        "/notifications",
        "/settings",
      ];
      const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
