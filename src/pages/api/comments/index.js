import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";

const MAX_COMMENT_LENGTH = 500;

function normalizeText(input) {
  return String(input || "").trim();
}

function validateScope({ scope, classKey, courseKey, semesterKey, subjectKey }) {
  if (!scope || !subjectKey) return "Scope and subject are required.";
  if (scope !== "class" && scope !== "course") return "Invalid scope.";
  if (scope === "class" && !classKey) return "classKey is required for class comments.";
  if (scope === "course" && (!courseKey || !semesterKey)) {
    return "courseKey and semesterKey are required for course comments.";
  }
  return "";
}

export default async function handler(req, res) {
  try {
    const db = await connectToDB();
    const comments = db.collection("comments");

    if (req.method === "GET") {
      const { scope, classKey, courseKey, semesterKey, subjectKey, limit } = req.query;
      const error = validateScope({ scope, classKey, courseKey, semesterKey, subjectKey });
      if (error) return res.status(400).json({ message: error });

      const query = {
        scope,
        subjectKey,
        classKey: classKey || null,
        courseKey: courseKey || null,
        semesterKey: semesterKey || null,
      };

      const parsedLimit = Number(limit) || 50;
      const items = await comments
        .find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(parsedLimit, 200))
        .toArray();

      return res.status(200).json({ comments: items });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) {
        return res.status(401).json({ message: "You must be signed in to comment." });
      }

      const { text, scope, classKey, courseKey, semesterKey, subjectKey } = req.body || {};
      const error = validateScope({ scope, classKey, courseKey, semesterKey, subjectKey });
      if (error) return res.status(400).json({ message: error });

      const cleaned = normalizeText(text);
      if (!cleaned) return res.status(400).json({ message: "Comment cannot be empty." });
      if (cleaned.length > MAX_COMMENT_LENGTH) {
        return res.status(400).json({ message: "Comment is too long." });
      }

      const doc = {
        text: cleaned,
        scope,
        subjectKey,
        classKey: classKey || null,
        courseKey: courseKey || null,
        semesterKey: semesterKey || null,
        createdAt: new Date(),
        createdBy: session.user.email,
        createdById: session.user.id,
      };

      const inserted = await comments.insertOne(doc);
      return res.status(201).json({ comment: { ...doc, _id: inserted.insertedId } });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
