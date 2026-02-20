import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function isOwner(session) {
  return session?.user?.role === "owner";
}

function normalizeEmail(input) {
  return String(input || "").trim().toLowerCase();
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!isOwner(session)) {
      return res.status(403).json({ message: "Only owner can manage users" });
    }

    const db = await connectToDB();
    const users = db.collection("users");

    if (req.method === "GET") {
      const list = await users
        .find({})
        .project({ name: 1, email: 1, role: 1, adminRequested: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ users: list });
    }

    if (req.method === "PATCH") {
      const { userId, email, action } = req.body || {};
      if (!action) return res.status(400).json({ message: "Invalid request" });

      if (action === "promote_by_email") {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });

        const target = await users.findOne({ email: normalizedEmail });
        if (!target) return res.status(404).json({ message: "User with this email was not found" });
        if (target.role === "owner") return res.status(400).json({ message: "Owner account cannot be modified" });

        await users.updateOne(
          { _id: target._id },
          { $set: { role: "admin", adminRequested: false, updatedAt: new Date() } }
        );
        return res.status(200).json({ message: "User promoted to admin" });
      }

      const _id = toObjectId(userId);
      if (!_id) return res.status(400).json({ message: "Invalid user id" });

      const target = await users.findOne({ _id });
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "owner") return res.status(400).json({ message: "Owner account cannot be modified" });

      if (action === "approve_admin") {
        await users.updateOne({ _id }, { $set: { role: "admin", adminRequested: false } });
        return res.status(200).json({ message: "Admin approved" });
      }

      if (action === "set_user") {
        await users.updateOne(
          { _id },
          { $set: { role: "user", adminRequested: false, updatedAt: new Date() } }
        );
        return res.status(200).json({ message: "Role changed to user" });
      }

      if (action === "set_admin") {
        await users.updateOne(
          { _id },
          { $set: { role: "admin", adminRequested: false, updatedAt: new Date() } }
        );
        return res.status(200).json({ message: "Role changed to admin" });
      }

      if (action === "demote_admin") {
        await users.updateOne(
          { _id },
          { $set: { role: "user", adminRequested: false, updatedAt: new Date() } }
        );
        return res.status(200).json({ message: "Admin demoted to user" });
      }

      if (action === "delete_user") {
        await users.deleteOne({ _id });
        return res.status(200).json({ message: "User deleted" });
      }

      return res.status(400).json({ message: "Unsupported action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Users API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
