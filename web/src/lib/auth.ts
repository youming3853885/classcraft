import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/next-auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google 登入時如果資料庫沒有紀錄，則回報錯誤（因為我們想把註冊交給 /register 頁面）
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          // 禁止自動註冊
          throw new Error("NOT_REGISTERED");
        } else {
          user.id = existing.id;
          // 同步最新頭像與名稱
          await prisma.user.update({
            where: { id: existing.id },
            data: { image: user.image, name: user.name ?? existing.name },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // 每次 request 從 DB 補最新 role（onboarding 後角色改變時即時生效）
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true },
        });
        if (dbUser) {
          token.role = dbUser.role as UserRole;
          token.name = dbUser.name ?? token.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TEACHER" | "STUDENT" | "ADMIN" | "ASSISTANT" | "PARENT";
      }
      return session;
    },
    // 登入後根據角色自動導向對應頁面
    async redirect({ url, baseUrl }) {
      // 如果 URL 已經是目標頁面，直接允許
      if (url.startsWith(baseUrl + "/student") || url.startsWith(baseUrl + "/teacher")) {
        return url;
      }
      // 預設導向 dashboard，會由客戶端進一步處理
      return baseUrl + "/dashboard";
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Firebase Tokens",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
        // These fields are passed during registration to sync with Prisma
        action: { label: "Action", type: "hidden" },
        name: { label: "Name", type: "hidden" },
        role: { label: "Role", type: "hidden" },
        classroomCode: { label: "Classroom Code", type: "hidden" },
        characterClass: { label: "Character Class", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          // Dynamic import of firebase-admin to prevent client-side bundle issues if any
          const { adminAuth } = await import("./firebase-admin");

          // Verify the Firebase ID token
          const decoded = await adminAuth.verifyIdToken(credentials.idToken);
          const email = decoded.email;
          if (!email) return null;

          // Find existing user in Prisma
          let user = await prisma.user.findFirst({
            where: { email },
          });

          // Handle Registration Action via Firebase Token passing
          if (credentials.action === "register") {
            if (user) {
              // User already exists in DB
              return { id: user.id, name: user.name, email: user.email, role: user.role as UserRole };
            }

            // Create newly registered user
            const role = credentials.role === "TEACHER" ? "TEACHER" : "STUDENT";
            
            user = await prisma.user.create({
              data: {
                email,
                name: credentials.name || email.split('@')[0],
                role,
                image: decoded.picture || null,
              },
            });

            // If Student registration logic... (we can keep it simple or expand)
            if (role === "STUDENT" && credentials.characterClass) {
               // ... Optional: add starting stats or character class logic here
            }
          } else {
            // Standard Login - User must exist! No auto-provisioning on simple login
            if (!user) {
              throw new Error("NOT_REGISTERED");
            }
          }

          return { id: user.id, name: user.name, email: user.email, role: user.role as UserRole };
        } catch (error) {
          console.error("Firebase auth verification error:", error);
          return null;
        }
      },
    }),
  ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
