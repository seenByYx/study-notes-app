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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Sign in to rate notes" });

    const { id, value } = req.body || {};
    const _id = toObjectId(id);
    const rating = Number(value);
    if (!_id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating request" });
    }

    const db = await connectToDB();
    const ratings = db.collection("note_ratings");
    const notes = db.collection("notes");

    const existing = await ratings.findOne({ noteId: _id, userId: session.user.id });
    if (existing) {
      const delta = rating - Number(existing.value || 0);
      await ratings.updateOne(
        { _id: existing._id },
        { $set: { value: rating, updatedAt: new Date() } }
      );
      await notes.updateOne({ _id }, { $inc: { ratingScore: delta } });
      return res.status(200).json({ message: "Rating updated" });
    }

    await ratings.insertOne({
      noteId: _id,
      userId: session.user.id,
      value: rating,
      createdAt: new Date(),
    });
    await notes.updateOne(
      { _id },
      { $inc: { ratingScore: rating, ratingCount: 1 } }
    );
    return res.status(200).json({ message: "Rated" });
  } catch (error) {
    console.error("Rate metric error:", error);
    return res.status(500).json({ message: "Failed to rate note" });
  }
}
