import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/sign-in"
  },
  providers: [
    CredentialsProvider({
      name: "邮箱密码登录",
      credentials: {
        email: {
          label: "邮箱",
          type: "email"
        },
        password: {
          label: "密码",
          type: "password"
        }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: isAdminEmail(user.email)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = "isAdmin" in user ? Boolean(user.isAdmin) : isAdminEmail(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
