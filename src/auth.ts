import NextAuth, { type Session, type User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/index";
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || "CPYod6I8Shhqy+3ghMxQUjB/K70v23FUnxy8zI3U5H8=",

  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: Session; user?: User }) {
      try {
        if (user && session?.user) {
          session.user.id = user.id;
        }
      } catch (error) {
        console.error("Error in session callback:", error);
        console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);
      }
      return session;
    },
  },
});
