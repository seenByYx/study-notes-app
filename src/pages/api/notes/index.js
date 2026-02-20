import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";
import { defaultSeedNotes } from "../../../../utils/catalog";

const validTypes = new Set(["pdf", "drive", "link"]);
const validNoteKinds = new Set(["notes", "question-paper", "assignment", "reference"]);

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

function parseTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  return String(input)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function validateUploadTemplate({ title, chapter, noteKind }) {
  if (!chapter) return "Chapter/Unit is required";
  if (!noteKind || !validNoteKinds.has(noteKind)) return "Invalid note type";
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle.includes(" - ")) {
    return "Title must follow template: Chapter - Topic";
  }
  return "";
}

async function seedIfEmpty(collection) {
  const existing = await collection.countDocuments({});
  if (existing > 0) return;
  await collection.insertMany(
    defaultSeedNotes.map((note) => ({
      ...note,
      chapter: note.chapter || "General",
      noteKind: note.noteKind || "notes",
      tags: note.tags || [],
      openCount: 0,
      ratingScore: 0,
      ratingCount: 0,
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
      const { scope, classKey, subjectKey, courseKey, semesterKey, limit, page, q, sort } = req.query;
      const query = {};

      const addEqFilter = (key, value) => {
        if (typeof value === "undefined" || value === null || value === "") {
          return;
        }
        // Ensure value is a simple string to avoid NoSQL operator injection
        if (Array.isArray(value) || typeof value !== "string") {
          throw new Error(`Invalid query parameter: ${key}`);
        }
        query[key] = { $eq: value };
      };

      try {
        addEqFilter("scope", scope);
        addEqFilter("classKey", classKey);
        addEqFilter("subjectKey", subjectKey);
        addEqFilter("courseKey", courseKey);
        addEqFilter("semesterKey", semesterKey);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }

      if (q) query.title = { $regex: String(q).trim(), $options: "i" };

      const parsedLimit = Math.min(Number(limit) || 20, 50);
      const parsedPage = Math.max(Number(page) || 1, 1);
      const skip = (parsedPage - 1) * parsedLimit;
      const sortMap = {
        recent: { createdAt: -1 },
        most_opened: { openCount: -1, createdAt: -1 },
        top_rated: { ratingScore: -1, ratingCount: -1, createdAt: -1 },
      };
      const selectedSort = sortMap[String(sort || "recent")] || sortMap.recent;

      const [items, total] = await Promise.all([
        notes.find(query).sort(selectedSort).skip(skip).limit(parsedLimit).toArray(),
        notes.countDocuments(query),
      ]);

      return res.status(200).json({
        notes: items,
        total,
        page: parsedPage,
        hasMore: skip + items.length < total,
      });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!canManageNotes(session)) {
        return res.status(403).json({ message: "Only owner or admin can manage notes" });
      }

      const { title, url, type, scope, classKey, subjectKey, courseKey, semesterKey, chapter, noteKind, tags } =
        req.body || {};
      if (!title || !url || !scope || !subjectKey) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const templateError = validateUploadTemplate({ title, chapter, noteKind });
      if (templateError) return res.status(400).json({ message: templateError });

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
        chapter: String(chapter).trim(),
        noteKind,
        tags: parseTags(tags),
        openCount: 0,
        ratingScore: 0,
        ratingCount: 0,
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

      const { id, title, url, type, chapter, noteKind, tags } = req.body || {};
      const _id = toObjectId(id);
      if (!_id || !title || !url) return res.status(400).json({ message: "Invalid request" });
      const templateError = validateUploadTemplate({ title, chapter, noteKind });
      if (templateError) return res.status(400).json({ message: templateError });

      await notes.updateOne(
        { _id },
        {
          $set: {
            title: String(title).trim(),
            url: normalizeUrl(String(url).trim()),
            type: validTypes.has(type) ? type : "link",
            chapter: String(chapter).trim(),
            noteKind,
            tags: parseTags(tags),
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
