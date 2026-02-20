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

function canModerate(session) {
  return session?.user?.role === "owner" || session?.user?.role === "admin";
}

function validateScope({ scope, classKey, courseKey, semesterKey, subjectKey }) {
  if (!scope || !subjectKey) return "Scope and subject are required.";
  if (scope !== "class" && scope !== "course") return "Invalid scope.";
  if (scope === "class" && !classKey) return "classKey is required for class requests.";
  if (scope === "course" && (!courseKey || !semesterKey)) {
    return "courseKey and semesterKey are required for course requests.";
  }
  return "";
}

export default async function handler(req, res) {
  try {
    const db = await connectToDB();
    const requests = db.collection("note_requests");

    if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);
      const moderator = canModerate(session);
      const { scope, classKey, courseKey, semesterKey, subjectKey, status, limit } = req.query;
      const query = {};

      if (scope) query.scope = scope;
      if (classKey) query.classKey = classKey;
      if (courseKey) query.courseKey = courseKey;
      if (semesterKey) query.semesterKey = semesterKey;
      if (subjectKey) query.subjectKey = subjectKey;
      query.status = status ? String(status) : "open";

      if (!moderator && !scope) {
        query.createdById = session?.user?.id || "__none__";
      }

      const parsedLimit = Math.min(Number(limit) || 20, 50);
      const items = await requests
        .find(query)
        .sort({ voteCount: -1, createdAt: -1 })
        .limit(parsedLimit)
        .toArray();
      return res.status(200).json({ requests: items });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user) return res.status(401).json({ message: "Sign in to request notes" });
      const { scope, classKey, courseKey, semesterKey, subjectKey, text } = req.body || {};
      const scopeError = validateScope({ scope, classKey, courseKey, semesterKey, subjectKey });
      if (scopeError) return res.status(400).json({ message: scopeError });
      const cleanText = String(text || "").trim();
      if (!cleanText) return res.status(400).json({ message: "Request details are required" });

      const existing = await requests.findOne({
        scope,
        classKey: classKey || null,
        courseKey: courseKey || null,
        semesterKey: semesterKey || null,
        subjectKey,
        text: cleanText,
        status: "open",
      });

      if (existing) {
        const alreadyVoted = (existing.voters || []).includes(session.user.id);
        if (!alreadyVoted) {
          await requests.updateOne(
            { _id: existing._id },
            { $addToSet: { voters: session.user.id }, $inc: { voteCount: 1 }, $set: { updatedAt: new Date() } }
          );
        }
        return res.status(200).json({ message: "Request already exists. Vote added." });
      }

      const doc = {
        scope,
        classKey: classKey || null,
        courseKey: courseKey || null,
        semesterKey: semesterKey || null,
        subjectKey,
        text: cleanText,
        status: "open",
        createdAt: new Date(),
        createdBy: session.user.name || session.user.email?.split("@")[0] || "User",
        createdById: session.user.id,
        voteCount: 1,
        voters: [session.user.id],
      };
      const inserted = await requests.insertOne(doc);
      return res.status(201).json({ request: { ...doc, _id: inserted.insertedId } });
    }

    if (req.method === "PATCH") {
      const session = await getServerSession(req, res, authOptions);
      if (!canModerate(session)) return res.status(403).json({ message: "Only owner/admin can manage requests" });
      const { id, action } = req.body || {};
      const _id = toObjectId(id);
      if (!_id || !action) return res.status(400).json({ message: "Invalid request" });

      if (action === "fulfill") {
        await requests.updateOne({ _id }, { $set: { status: "fulfilled", updatedAt: new Date() } });
        return res.status(200).json({ message: "Request marked fulfilled" });
      }
      if (action === "reject") {
        await requests.updateOne({ _id }, { $set: { status: "rejected", updatedAt: new Date() } });
        return res.status(200).json({ message: "Request rejected" });
      }
      return res.status(400).json({ message: "Unsupported action" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Requests API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
