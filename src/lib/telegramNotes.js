import { Readable } from "stream";
import { google } from "googleapis";
import { catalog } from "../../utils/catalog";

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanTitleFromFilename(fileName) {
  const noExt = String(fileName || "untitled").replace(/\.[^.]+$/, "");
  return noExt.replace(/[_-]+/g, " ").trim() || "Untitled Note";
}

function buildClassCandidates() {
  const items = [];
  Object.entries(catalog.classes).forEach(([classKey, classData]) => {
    classData.subjects.forEach((subject) => {
      items.push({
        scope: "class",
        classKey,
        subjectKey: subject.key,
        label: `${classData.label} / ${subject.label}`,
        keywords: [classKey, classData.label, subject.key, subject.label].map(normalize),
      });
    });
  });
  return items;
}

function buildCourseCandidates() {
  const items = [];
  Object.entries(catalog.courses).forEach(([courseKey, courseData]) => {
    Object.entries(courseData.semesters).forEach(([semesterKey, semesterData]) => {
      semesterData.subjects.forEach((subject) => {
        items.push({
          scope: "course",
          courseKey,
          semesterKey,
          subjectKey: subject.key,
          label: `${courseData.label} / ${semesterData.label} / ${subject.label}`,
          keywords: [courseKey, courseData.label, semesterKey, semesterData.label, subject.key, subject.label].map(
            normalize
          ),
        });
      });
    });
  });
  return items;
}

const CLASS_CANDIDATES = buildClassCandidates();
const COURSE_CANDIDATES = buildCourseCandidates();

function scoreCandidate(text, candidate) {
  const joined = ` ${text} `;
  let score = 0;
  candidate.keywords.forEach((keyword) => {
    if (!keyword) return;
    if (joined.includes(` ${keyword} `)) score += 3;
    else if (joined.includes(keyword)) score += 1;
  });
  return score;
}

function parseMetaFromCaption(caption, fallbackTitle) {
  const parts = String(caption || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const noteKindRaw = String(parts[parts.length - 1] || "").toLowerCase();
  const validKinds = new Set(["notes", "question-paper", "assignment", "reference"]);
  const noteKind = validKinds.has(noteKindRaw) ? noteKindRaw : "notes";

  const preferredTitle = parts.length >= 3 ? parts[parts.length - 2] : "";
  let title = preferredTitle || fallbackTitle;
  if (!title.includes(" - ")) title = `General - ${title}`;

  const chapter = title.split(" - ")[0]?.trim() || "General";
  return { title, chapter, noteKind };
}

export function classifyFromText({ caption, fileName }) {
  const rawText = `${caption || ""} ${fileName || ""}`;
  const text = normalize(rawText);

  const allCandidates = [...CLASS_CANDIDATES, ...COURSE_CANDIDATES];
  let best = null;
  let bestScore = 0;
  allCandidates.forEach((candidate) => {
    const score = scoreCandidate(text, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  });

  const fallbackTitle = cleanTitleFromFilename(fileName);
  const meta = parseMetaFromCaption(caption, fallbackTitle);

  if (!best || bestScore < 4) {
    return {
      ok: false,
      reason:
        "Unable to classify. Use caption like: Class 12 | Chemistry | Chapter - Topic | notes, or BSc Computer Science | Semester 4 | Microprocessor | Chapter - Topic | notes.",
      ...meta,
    };
  }

  if (best.scope === "class") {
    return {
      ok: true,
      scope: "class",
      classKey: best.classKey,
      subjectKey: best.subjectKey,
      classificationLabel: best.label,
      ...meta,
    };
  }

  return {
    ok: true,
    scope: "course",
    courseKey: best.courseKey,
    semesterKey: best.semesterKey,
    subjectKey: best.subjectKey,
    classificationLabel: best.label,
    ...meta,
  };
}

function getDriveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env");

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

async function findFolderByName(drive, parentId, folderName) {
  const safeName = folderName.replace(/'/g, "\\'");
  const query = [
    `'${parentId}' in parents`,
    "mimeType='application/vnd.google-apps.folder'",
    `name='${safeName}'`,
    "trashed=false",
  ].join(" and ");

  const res = await drive.files.list({
    q: query,
    fields: "files(id,name)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files?.[0] || null;
}

async function ensureFolder(drive, parentId, folderName) {
  const existing = await findFolderByName(drive, parentId, folderName);
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return created.data.id;
}

export async function uploadToDrive({ fileBuffer, fileName, mimeType, classification }) {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID env");

  let parentId = rootFolderId;
  if (classification.scope === "class") {
    parentId = await ensureFolder(drive, parentId, classification.classKey);
    parentId = await ensureFolder(drive, parentId, classification.subjectKey);
  } else {
    parentId = await ensureFolder(drive, parentId, classification.courseKey);
    parentId = await ensureFolder(drive, parentId, classification.semesterKey);
    parentId = await ensureFolder(drive, parentId, classification.subjectKey);
  }

  const createRes = await drive.files.create({
    requestBody: { name: fileName, parents: [parentId] },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: Readable.from(fileBuffer),
    },
    fields: "id,name,webViewLink,webContentLink",
    supportsAllDrives: true,
  });

  const fileId = createRes.data.id;
  const isPublic = String(process.env.GOOGLE_DRIVE_PUBLIC || "true").toLowerCase() !== "false";
  if (isPublic) {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });
  }

  return {
    fileId,
    webViewLink: createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    folderId: parentId,
  };
}
