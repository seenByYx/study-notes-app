import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDB } from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

function isOwnerEmail(email) {
  const ownerEmail = String(process.env.OWNER_EMAIL || "").trim().toLowerCase();
  return Boolean(ownerEmail) && String(email || "").trim().toLowerCase() === ownerEmail;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const db = await connectToDB();
        const normalizedEmail = String(credentials.email || "").trim().toLowerCase();
        const user = await db.collection("users").findOne({ email: normalizedEmail });

        if (!user) throw new Error("User not found");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name || user.email?.split("@")[0] || "User",
          image: user.image || null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      const db = await connectToDB();
      const users = db.collection("users");
      const normalizedEmail = String(user.email || "").trim().toLowerCase();
      const existing = await users.findOne({ email: normalizedEmail });
      const ownerLogin = isOwnerEmail(normalizedEmail);

      if (!existing) {
        const inserted = await users.insertOne({
          name: user.name || user.email?.split("@")[0] || "User",
          email: normalizedEmail,
          role: ownerLogin ? "owner" : "user",
          image: user.image || null,
          provider: "google",
          createdAt: new Date(),
        });
        user.id = inserted.insertedId.toString();
        user.role = ownerLogin ? "owner" : "user";
        return true;
      }

      if (ownerLogin && existing.role !== "owner") {
        await users.updateOne({ _id: existing._id }, { $set: { role: "owner" } });
        user.id = existing._id.toString();
        user.role = "owner";
        return true;
      }

      user.id = existing._id.toString();
      user.role = existing.role || "user";
      user.name = existing.name || user.name || user.email?.split("@")[0] || "User";
      user.image = existing.image || user.image || null;
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name || session.user.name;
        session.user.image = token.picture || session.user.image || null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || token.role || "user";
        token.name = user.name || token.name || "User";
        token.picture = user.image || token.picture || null;
      }
      if (!token.role) token.role = "user";
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
};

export default NextAuth(authOptions);
