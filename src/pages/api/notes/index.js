import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";
import { defaultSeedNotes } from "../../../../utils/catalog";

const validTypes = new Set(["pdf", "drive", "link"]);

function normalizeUrl(input) {
  if (!input) return "";
  if (input.startsWith("/")) return input;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  return `https://${input}`;
}

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function canManageNotes(session) {
  return session?.user?.role === "admin" || session?.user?.role === "owner";
}

async function seedIfEmpty(collection) {
  const existing = await collection.countDocuments({});
  if (existing > 0) return;
  await collection.insertMany(
    defaultSeedNotes.map((note) => ({
      ...note,
      createdAt: new Date(),
      createdBy: "seed",
    }))
  );
}

export default async function handler(req, res) {
  try {
    const db = await connectToDB();
    const notes = db.collection("notes");
    await seedIfEmpty(notes);

    if (req.method === "GET") {
      const { scope, classKey, subjectKey, courseKey, semesterKey, limit } = req.query;
      const query = {};

      if (scope) query.scope = scope;
      if (classKey) query.classKey = classKey;
      if (subjectKey) query.subjectKey = subjectKey;
      if (courseKey) query.courseKey = courseKey;
      if (semesterKey) query.semesterKey = semesterKey;

      const parsedLimit = Number(limit) || 100;
      const items = await notes
        .find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(parsedLimit, 200))
        .toArray();

      return res.status(200).json({ notes: items });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!canManageNotes(session)) {
        return res.status(403).json({ message: "Only owner or admin can manage notes" });
      }

      const { title, url, type, scope, classKey, subjectKey, courseKey, semesterKey } = req.body || {};
      if (!title || !url || !scope || !subjectKey) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (scope !== "class" && scope !== "course") {
        return res.status(400).json({ message: "Invalid scope" });
      }

      if (scope === "class" && !classKey) {
        return res.status(400).json({ message: "classKey is required for class notes" });
      }

      if (scope === "course" && (!courseKey || !semesterKey)) {
        return res.status(400).json({ message: "courseKey and semesterKey are required for course notes" });
      }

      const doc = {
        title: String(title).trim(),
        url: normalizeUrl(String(url).trim()),
        type: validTypes.has(type) ? type : "link",
        scope,
        subjectKey,
        classKey: classKey || null,
        courseKey: courseKey || null,
        semesterKey: semesterKey || null,
        createdAt: new Date(),
        createdBy: session.user.email,
      };

      const inserted = await notes.insertOne(doc);
      return res.status(201).json({ note: { ...doc, _id: inserted.insertedId } });
    }

    if (req.method === "PUT") {
      const session = await getServerSession(req, res, authOptions);
      if (!canManageNotes(session)) {
        return res.status(403).json({ message: "Only owner or admin can manage notes" });
      }

      const { id, title, url, type } = req.body || {};
      const _id = toObjectId(id);
      if (!_id || !title || !url) return res.status(400).json({ message: "Invalid request" });

      await notes.updateOne(
        { _id },
        {
          $set: {
            title: String(title).trim(),
            url: normalizeUrl(String(url).trim()),
            type: validTypes.has(type) ? type : "link",
            updatedAt: new Date(),
            updatedBy: session.user.email,
          },
        }
      );

      return res.status(200).json({ message: "Note updated" });
    }

    if (req.method === "DELETE") {
      const session = await getServerSession(req, res, authOptions);
      if (!canManageNotes(session)) {
        return res.status(403).json({ message: "Only owner or admin can manage notes" });
      }

      const { id } = req.body || {};
      const _id = toObjectId(id);
      if (!_id) return res.status(400).json({ message: "Invalid note id" });

      await notes.deleteOne({ _id });
      return res.status(200).json({ message: "Note deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Notes API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
