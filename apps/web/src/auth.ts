import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import { env } from "./lib/env";

const providers: NextAuthConfig["providers"] = [];

if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET
    })
  );
}

if (env.NEXT_PUBLIC_DEMO_MODE) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {
        email: { label: "Demo email", type: "email", placeholder: "demo@pixelsync.dev" }
      },
      async authorize(credentials) {
        const email = typeof credentials.email === "string" ? credentials.email : "demo@pixelsync.dev";

        try {
          return await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              name: email === "demo@pixelsync.dev" ? "PixelSync Demo" : "Demo Artist",
              email,
              image: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(email)}`
            },
            select: { id: true, name: true, email: true, image: true }
          });
        } catch (error) {
          console.error("Demo sign-in failed. Check DATABASE_URL and make sure Postgres is running.", error);
          return null;
        }
      }
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/sign-in"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        if (typeof user.id === "string") {
          token.sub = user.id;
        }
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name ?? null;
        session.user.email = typeof token.email === "string" ? token.email : "";
        session.user.image = typeof token.picture === "string" ? token.picture : null;
      }

      return session;
    }
  },
  trustHost: true,
  secret: env.AUTH_SECRET
});
