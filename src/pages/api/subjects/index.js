import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDB } from "../../../lib/mongodb";

function canManage(session) {
  return session?.user?.role === "admin" || session?.user?.role === "owner";
}

function normalizeScope(input) {
  const value = String(input || "").trim();
  return value === "class" || value === "course" ? value : "";
}

function normalizeText(input) {
  return String(input || "").trim();
}

export default async function handler(req, res) {
  try {
    const db = await connectToDB();
    const subjects = db.collection("custom_subjects");
    const legacySubjects = db.collection("telegram_custom_subjects");

    if (req.method === "GET") {
      const scope = normalizeScope(req.query.scope);
      const classKey = normalizeText(req.query.classKey);
      const courseKey = normalizeText(req.query.courseKey);
      const semesterKey = normalizeText(req.query.semesterKey);

      if (!scope) return res.status(400).json({ message: "Invalid scope" });
      if (scope === "class" && !classKey) return res.status(400).json({ message: "classKey is required" });
      if (scope === "course" && (!courseKey || !semesterKey)) {
        return res.status(400).json({ message: "courseKey and semesterKey are required" });
      }

      const query =
        scope === "class"
          ? { scope, classKey, courseKey: null, semesterKey: null }
          : { scope, classKey: null, courseKey, semesterKey };

      const [items, legacyItems] = await Promise.all([
        subjects.find(query).sort({ label: 1 }).toArray(),
        legacySubjects.find(query).sort({ label: 1 }).toArray(),
      ]);

      const map = new Map();
      [...items, ...legacyItems].forEach((item) => {
        if (!item?.key) return;
        if (!map.has(item.key)) {
          map.set(item.key, { key: item.key, label: item.label || item.key });
        }
      });

      return res.status(200).json({ subjects: Array.from(map.values()) });
    }

    if (req.method === "POST") {
      const session = await getServerSession(req, res, authOptions);
      if (!canManage(session)) return res.status(403).json({ message: "Only owner/admin can add subjects" });

      const scope = normalizeScope(req.body?.scope);
      const classKey = normalizeText(req.body?.classKey);
      const courseKey = normalizeText(req.body?.courseKey);
      const semesterKey = normalizeText(req.body?.semesterKey);
      const key = normalizeText(req.body?.key);
      const label = normalizeText(req.body?.label);

      if (!scope || !key || !label) return res.status(400).json({ message: "Missing required fields" });
      if (scope === "class" && !classKey) return res.status(400).json({ message: "classKey is required" });
      if (scope === "course" && (!courseKey || !semesterKey)) {
        return res.status(400).json({ message: "courseKey and semesterKey are required" });
      }

      const identity =
        scope === "class"
          ? { scope, classKey, courseKey: null, semesterKey: null, key }
          : { scope, classKey: null, courseKey, semesterKey, key };

      await subjects.updateOne(
        identity,
        {
          $set: {
            ...identity,
            label,
            updatedAt: new Date(),
            updatedBy: session.user.email,
          },
          $setOnInsert: {
            createdAt: new Date(),
            createdBy: session.user.email,
          },
        },
        { upsert: true }
      );

      return res.status(200).json({ subject: { key, label } });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Subjects API error:", error);
    return res.status(500).json({ message: "Failed to process request" });
  }
}
