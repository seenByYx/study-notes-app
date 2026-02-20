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
      const { userId, action } = req.body || {};
      const _id = toObjectId(userId);
      if (!_id || !action) return res.status(400).json({ message: "Invalid request" });

      const target = await users.findOne({ _id });
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "owner") return res.status(400).json({ message: "Owner account cannot be modified" });

      if (action === "approve_admin") {
        await users.updateOne({ _id }, { $set: { role: "admin", adminRequested: false } });
        return res.status(200).json({ message: "Admin approved" });
      }

      if (action === "set_user") {
        await users.updateOne({ _id }, { $set: { role: "user", adminRequested: false } });
        return res.status(200).json({ message: "Role changed to user" });
      }

      if (action === "set_admin") {
        await users.updateOne({ _id }, { $set: { role: "admin", adminRequested: false } });
        return res.status(200).json({ message: "Role changed to admin" });
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
