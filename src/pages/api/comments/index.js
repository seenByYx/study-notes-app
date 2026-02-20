import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";

const MAX_COMMENT_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

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

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function canModerateComments(session) {
  return session?.user?.role === "owner" || session?.user?.role === "admin";
}

export default async function handler(req, res) {
  try {
    const db = await connectToDB();
    const comments = db.collection("comments");

    if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);
      const isModerator = canModerateComments(session);
      const { scope, classKey, courseKey, semesterKey, subjectKey, limit, page, status, q } = req.query;

      const requestedStatus = String(status || "active");
      const moderationQueue = requestedStatus === "reported";

      if (!moderationQueue || !isModerator) {
        const error = validateScope({ scope, classKey, courseKey, semesterKey, subjectKey });
        if (error) return res.status(400).json({ message: error });
      }

      const query = {};
      if (!moderationQueue || !isModerator) {
        query.scope = scope;
        query.subjectKey = subjectKey;
        query.classKey = classKey || null;
        query.courseKey = courseKey || null;
        query.semesterKey = semesterKey || null;
        query.status = "active";
      } else {
        query.status = "reported";
      }
      if (q) query.text = { $regex: String(q).trim(), $options: "i" };

      const parsedLimit = Math.min(Number(limit) || 20, 50);
      const parsedPage = Math.max(Number(page) || 1, 1);
      const skip = (parsedPage - 1) * parsedLimit;

      const [items, total] = await Promise.all([
        comments.find(query).sort({ createdAt: -1, reportCount: -1 }).skip(skip).limit(parsedLimit).toArray(),
        comments.countDocuments(query),
      ]);

      return res.status(200).json({
        comments: items,
        total,
        page: parsedPage,
        hasMore: skip + items.length < total,
      });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) {
        return res.status(401).json({ message: "You must be signed in to comment." });
      }

      const { text, scope, classKey, courseKey, semesterKey, subjectKey } = req.body || {};
      const error = validateScope({ scope, classKey, courseKey, semesterKey, subjectKey });
      if (error) return res.status(400).json({ message: error });

      const recentCount = await comments.countDocuments({
        createdById: session.user.id,
        createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      });
      if (recentCount >= RATE_LIMIT_MAX) {
        return res.status(429).json({ message: "Rate limit exceeded. Try again in a few minutes." });
      }

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
        createdBy: session.user.name || session.user.email?.split("@")[0] || "User",
        createdByImage: session.user.image || null,
        createdById: session.user.id,
        status: "active",
        reportCount: 0,
        reportedBy: [],
      };

      const inserted = await comments.insertOne(doc);
      return res.status(201).json({ comment: { ...doc, _id: inserted.insertedId } });
    }

    if (req.method === "PATCH") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) return res.status(401).json({ message: "Unauthorized" });
      const { id, action } = req.body || {};
      const _id = toObjectId(id);
      if (!_id || !action) return res.status(400).json({ message: "Invalid request" });

      if (action === "report") {
        const existing = await comments.findOne({ _id });
        if (!existing) return res.status(404).json({ message: "Comment not found" });
        if (existing.createdById === session.user.id) {
          return res.status(400).json({ message: "You cannot report your own comment" });
        }
        if ((existing.reportedBy || []).includes(session.user.id)) {
          return res.status(200).json({ message: "Already reported" });
        }

        await comments.updateOne(
          { _id },
          {
            $addToSet: { reportedBy: session.user.id },
            $inc: { reportCount: 1 },
            $set: { status: "reported", updatedAt: new Date() },
          }
        );
        return res.status(200).json({ message: "Comment reported" });
      }

      if (!canModerateComments(session)) {
        return res.status(403).json({ message: "Only owner or admin can moderate comments." });
      }

      if (action === "resolve") {
        await comments.updateOne(
          { _id },
          { $set: { status: "active", reportCount: 0, reportedBy: [], updatedAt: new Date() } }
        );
        return res.status(200).json({ message: "Comment restored" });
      }

      return res.status(400).json({ message: "Unsupported action" });
    }

    if (req.method === "DELETE") {
      const session = await getServerSession(req, res, authOptions);
      if (!canModerateComments(session)) {
        return res.status(403).json({ message: "Only owner or admin can delete comments." });
      }

      const { id } = req.body || {};
      const _id = toObjectId(id);
      if (!_id) return res.status(400).json({ message: "Invalid comment id." });

      await comments.deleteOne({ _id });
      return res.status(200).json({ message: "Comment deleted." });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
