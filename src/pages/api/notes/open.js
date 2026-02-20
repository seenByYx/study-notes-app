import { ObjectId } from "mongodb";
import { connectToDB } from "../../../lib/mongodb";

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  try {
    const { id } = req.body || {};
    const _id = toObjectId(id);
    if (!_id) return res.status(400).json({ message: "Invalid note id" });

    const db = await connectToDB();
    await db.collection("notes").updateOne({ _id }, { $inc: { openCount: 1 } });
    return res.status(200).json({ message: "Tracked" });
  } catch (error) {
    console.error("Open metric error:", error);
    return res.status(500).json({ message: "Failed to track open" });
  }
}
