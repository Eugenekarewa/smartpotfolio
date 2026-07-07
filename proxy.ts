import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Deliberately a separate, Edge-safe NextAuth instance (no providers, no
// Mongoose) — the full auth.ts config pulls in Mongoose, which the Edge
// Runtime Proxy executes in cannot support.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/bills/:path*",
    "/businesses/:path*",
    "/billing/:path*",
    "/market/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
