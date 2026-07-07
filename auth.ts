import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { authConfig } from "./auth.config";
import { startTrialIfNeeded } from "@/lib/billing/entitlement";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await connectToDatabase();
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: create the User document on first login (FR-1.1).
      if (account?.provider === "google" && user.email) {
        await connectToDatabase();
        const dbUser = await User.findOneAndUpdate(
          { email: user.email.toLowerCase().trim() },
          {
            $setOnInsert: {
              name: user.name ?? user.email,
              email: user.email.toLowerCase().trim(),
              image: user.image,
            },
          },
          { upsert: true, new: true }
        );
        await startTrialIfNeeded(dbUser._id);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email.toLowerCase().trim() }).lean();
        if (dbUser) {
          token.userId = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
