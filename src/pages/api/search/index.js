import { connectToDB } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });
  try {
    const db = await connectToDB();
    const notes = db.collection("notes");
    const comments = db.collection("comments");

    const { q, filter, limit } = req.query;
    const queryText = String(q || "").trim();
    if (!queryText) return res.status(200).json({ results: [] });
    const parsedLimit = Math.min(Number(limit) || 20, 50);

    const noteSortMap = {
      recent: { createdAt: -1 },
      most_opened: { openCount: -1, createdAt: -1 },
      top_rated: { ratingScore: -1, ratingCount: -1, createdAt: -1 },
    };
    const selectedFilter = String(filter || "recent");
    const noteSort = noteSortMap[selectedFilter] || noteSortMap.recent;

    const [noteItems, commentItems] = await Promise.all([
      notes
        .find({ title: { $regex: queryText, $options: "i" } })
        .sort(noteSort)
        .limit(parsedLimit)
        .project({
          title: 1,
          scope: 1,
          classKey: 1,
          courseKey: 1,
          semesterKey: 1,
          subjectKey: 1,
          openCount: 1,
          ratingScore: 1,
          createdAt: 1,
        })
        .toArray(),
      comments
        .find({ text: { $regex: queryText, $options: "i" }, status: "active" })
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .project({
          text: 1,
          createdBy: 1,
          scope: 1,
          classKey: 1,
          courseKey: 1,
          semesterKey: 1,
          subjectKey: 1,
          createdAt: 1,
        })
        .toArray(),
    ]);

    const noteResults = noteItems.map((note) => {
      const href =
        note.scope === "class"
          ? `/classes/${note.classKey}/${note.subjectKey}`
          : `/courses/${note.courseKey}/${note.semesterKey}/${note.subjectKey}`;
      return {
        type: "note",
        title: note.title,
        subtitle: `opens: ${note.openCount || 0} | score: ${note.ratingScore || 0}`,
        href,
        createdAt: note.createdAt,
      };
    });

    const commentResults = commentItems.map((comment) => {
      const href =
        comment.scope === "class"
          ? `/classes/${comment.classKey}/${comment.subjectKey}`
          : `/courses/${comment.courseKey}/${comment.semesterKey}/${comment.subjectKey}`;
      return {
        type: "comment",
        title: comment.text,
        subtitle: `comment by ${comment.createdBy || "user"}`,
        href,
        createdAt: comment.createdAt,
      };
    });

    const merged = [...noteResults, ...commentResults];
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ results: merged.slice(0, parsedLimit) });
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ message: "Failed to search" });
  }
}
