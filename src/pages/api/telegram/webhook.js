import { connectToDB } from "../../../lib/mongodb";
import { uploadToDrive } from "../../../lib/telegramNotes";
import { catalog } from "../../../../utils/catalog";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const VALID_NOTE_KINDS = new Set(["notes", "question-paper", "assignment", "reference"]);
const VALID_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const VALID_EXTENSIONS = [".pdf", ".pptx"];
const BTN_ADD_SUBJECT = "Add new subject";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

async function telegramRequest(method, payload) {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    const description = data?.description || "Telegram API request failed";
    throw new Error(description);
  }
  return data;
}

function buildLaunchMessage(webAppUrl) {
  return {
    text: "Open Study Notes Mini App:",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open Study Notes",
            web_app: { url: webAppUrl },
          },
        ],
      ],
    },
  };
}

function isUploaderAllowed(chatId) {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS;
  if (!raw) return true;
  const allowed = new Set(
    String(raw)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
  return allowed.has(String(chatId));
}

function sessionCollection(db) {
  return db.collection("telegram_upload_sessions");
}

function buildUploaderId(message) {
  return message.from?.username ? `telegram:@${message.from.username}` : `telegram:${message.from?.id || "unknown"}`;
}

function fileExt(name) {
  const lower = String(name || "").toLowerCase();
  for (const ext of VALID_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  return "";
}

function isAllowedDocument(document) {
  if (!document) return false;
  const ext = fileExt(document.file_name);
  return VALID_MIME_TYPES.has(String(document.mime_type || "")) && !!ext;
}

function getClassSubjects(classKey) {
  return catalog.classes[classKey]?.subjects || [];
}

function getCourseSemesters(courseKey) {
  return catalog.courses[courseKey]?.semesters || {};
}

function getSemesterSubjects(courseKey, semesterKey) {
  return catalog.courses[courseKey]?.semesters?.[semesterKey]?.subjects || [];
}

function customSubjectCollection(db) {
  return db.collection("custom_subjects");
}

function chunkButtons(items, size = 3) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size).map((item) => ({ text: item })));
  }
  return rows;
}

function buildReplyKeyboard(options) {
  if (!options.length) return undefined;
  return {
    keyboard: chunkButtons(options),
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function subjectKeyFromInput(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getCustomSubjects(db, filter) {
  return customSubjectCollection(db).find(filter).toArray();
}

async function listAvailableSubjects(db, data) {
  const map = new Map();

  if (data.scope === "class") {
    getClassSubjects(data.classKey).forEach((s) => map.set(s.key, s.label || s.key));
    const custom = await getCustomSubjects(db, {
      scope: "class",
      classKey: data.classKey,
    });
    custom.forEach((s) => map.set(s.key, s.label || s.key));
  } else {
    getSemesterSubjects(data.courseKey, data.semesterKey).forEach((s) => map.set(s.key, s.label || s.key));
    const custom = await getCustomSubjects(db, {
      scope: "course",
      courseKey: data.courseKey,
      semesterKey: data.semesterKey,
    });
    custom.forEach((s) => map.set(s.key, s.label || s.key));
  }

  return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
}

async function createCustomSubject(db, data, input) {
  const key = subjectKeyFromInput(input);
  if (!key || key.length < 2) return null;

  const doc =
    data.scope === "class"
      ? {
          scope: "class",
          classKey: data.classKey,
          key,
          label: String(input || "").trim() || key,
          createdAt: new Date(),
        }
      : {
          scope: "course",
          courseKey: data.courseKey,
          semesterKey: data.semesterKey,
          key,
          label: String(input || "").trim() || key,
          createdAt: new Date(),
        };

  await customSubjectCollection(db).updateOne(
    data.scope === "class"
      ? { scope: "class", classKey: data.classKey, key }
      : { scope: "course", courseKey: data.courseKey, semesterKey: data.semesterKey, key },
    { $set: doc },
    { upsert: true }
  );

  return key;
}

async function getSession(db, chatId, userId) {
  return sessionCollection(db).findOne({ chatId: String(chatId), userId: String(userId) });
}

async function upsertSession(db, chatId, userId, step, data = {}) {
  await sessionCollection(db).updateOne(
    { chatId: String(chatId), userId: String(userId) },
    {
      $set: {
        step,
        data,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

async function clearSession(db, chatId, userId) {
  await sessionCollection(db).deleteOne({ chatId: String(chatId), userId: String(userId) });
}

function buildScopePrompt() {
  return "Upload flow started.\nChoose scope: class or course";
}

function buildClassPrompt() {
  return `Enter class key:\n${Object.keys(catalog.classes).join(", ")}`;
}

function buildCoursePrompt() {
  return `Enter course key:\n${Object.keys(catalog.courses).join(", ")}`;
}

function buildSemesterPrompt(courseKey) {
  const semesters = Object.keys(getCourseSemesters(courseKey));
  return `Enter semester key for ${courseKey}:\n${semesters.join(", ")}`;
}

function buildSubjectPromptMessage(pathLabel, subjects) {
  if (!subjects.length) {
    return {
      text: `No subjects found for ${pathLabel}.\nTap "${BTN_ADD_SUBJECT}" to create one.`,
      reply_markup: buildReplyKeyboard([BTN_ADD_SUBJECT]),
    };
  }

  const keys = subjects.map((s) => s.key);
  return {
    text: `Choose subject key for ${pathLabel}:`,
    reply_markup: buildReplyKeyboard([...keys, BTN_ADD_SUBJECT]),
  };
}

async function insertNoteDoc({ classification, driveLink, title, chapter, noteKind, uploader }) {
  const db = await connectToDB();
  const notes = db.collection("notes");

  const doc = {
    title,
    url: driveLink,
    type: "drive",
    scope: classification.scope,
    subjectKey: classification.subjectKey,
    classKey: classification.classKey || null,
    courseKey: classification.courseKey || null,
    semesterKey: classification.semesterKey || null,
    chapter,
    noteKind,
    tags: ["telegram-upload"],
    openCount: 0,
    ratingScore: 0,
    ratingCount: 0,
    createdAt: new Date(),
    createdBy: uploader,
    source: "telegram-bot",
  };

  const inserted = await notes.insertOne(doc);
  return inserted.insertedId;
}

async function startUploadFlow(db, message) {
  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;
  await upsertSession(db, chatId, userId, "await_scope", {});
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text: buildScopePrompt(),
  });
}

async function processFlowText(db, message, session, text) {
  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;
  const value = String(text || "").trim();
  const lower = value.toLowerCase();
  const data = session?.data || {};

  if (!session) return false;

  if (session.step === "await_scope") {
    if (lower !== "class" && lower !== "course") {
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Please type exactly: class or course" });
      return true;
    }

    const nextStep = lower === "class" ? "await_class_key" : "await_course_key";
    await upsertSession(db, chatId, userId, nextStep, { scope: lower });
    await telegramRequest("sendMessage", { chat_id: chatId, text: lower === "class" ? buildClassPrompt() : buildCoursePrompt() });
    return true;
  }

  if (session.step === "await_class_key") {
    if (!catalog.classes[value]) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: `Invalid class key.\n${buildClassPrompt()}` });
      return true;
    }

    const nextData = { ...data, classKey: value };
    await upsertSession(db, chatId, userId, "await_subject_key", nextData);
    const subjects = await listAvailableSubjects(db, nextData);
    const prompt = buildSubjectPromptMessage(value, subjects);
    await telegramRequest("sendMessage", { chat_id: chatId, ...prompt });
    return true;
  }

  if (session.step === "await_course_key") {
    if (!catalog.courses[value]) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: `Invalid course key.\n${buildCoursePrompt()}` });
      return true;
    }

    const nextData = { ...data, courseKey: value };
    await upsertSession(db, chatId, userId, "await_semester_key", nextData);
    await telegramRequest("sendMessage", { chat_id: chatId, text: buildSemesterPrompt(value) });
    return true;
  }

  if (session.step === "await_semester_key") {
    if (!getCourseSemesters(data.courseKey)[value]) {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: `Invalid semester key.\n${buildSemesterPrompt(data.courseKey)}`,
      });
      return true;
    }

    const nextData = { ...data, semesterKey: value };
    await upsertSession(db, chatId, userId, "await_subject_key", nextData);
    const subjects = await listAvailableSubjects(db, nextData);
    const prompt = buildSubjectPromptMessage(`${data.courseKey}/${value}`, subjects);
    await telegramRequest("sendMessage", { chat_id: chatId, ...prompt });
    return true;
  }

  if (session.step === "await_subject_key") {
    if (lower === BTN_ADD_SUBJECT.toLowerCase()) {
      await upsertSession(db, chatId, userId, "await_new_subject_key", data);
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Enter new subject name/key (example: accountancy)",
      });
      return true;
    }

    const subjects = await listAvailableSubjects(db, data);
    const valid = new Set(subjects.map((s) => s.key));
    const normalizedValue = subjectKeyFromInput(value);
    const selectedKey = valid.has(value) ? value : normalizedValue;
    if (!valid.has(selectedKey)) {
      const prompt = buildSubjectPromptMessage(
        data.scope === "class" ? data.classKey : `${data.courseKey}/${data.semesterKey}`,
        subjects
      );
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: `Invalid subject key.\n${prompt.text}`,
        reply_markup: prompt.reply_markup,
      });
      return true;
    }

    await upsertSession(db, chatId, userId, "await_chapter", { ...data, subjectKey: selectedKey });
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Enter chapter/unit (example: Chapter 3)" });
    return true;
  }

  if (session.step === "await_new_subject_key") {
    const newKey = await createCustomSubject(db, data, value);
    if (!newKey) {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Invalid subject name. Try letters/numbers only (example: accountancy).",
      });
      return true;
    }
    await upsertSession(db, chatId, userId, "await_chapter", { ...data, subjectKey: newKey });
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: `Subject saved as "${newKey}".\nEnter chapter/unit (example: Chapter 3)`,
    });
    return true;
  }

  if (session.step === "await_chapter") {
    if (!value) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Chapter is required. Try again." });
      return true;
    }
    await upsertSession(db, chatId, userId, "await_topic", { ...data, chapter: value });
    await telegramRequest("sendMessage", { chat_id: chatId, text: "Enter topic/title part (example: Electrochemistry Numericals)" });
    return true;
  }

  if (session.step === "await_topic") {
    if (!value) {
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Topic is required. Try again." });
      return true;
    }
    await upsertSession(db, chatId, userId, "await_note_kind", { ...data, topic: value });
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "Enter note kind: notes, question-paper, assignment, reference",
    });
    return true;
  }

  if (session.step === "await_note_kind") {
    if (!VALID_NOTE_KINDS.has(lower)) {
      await telegramRequest("sendMessage", {
        chat_id: chatId,
        text: "Invalid note kind. Use: notes, question-paper, assignment, reference",
      });
      return true;
    }
    await upsertSession(db, chatId, userId, "await_document", { ...data, noteKind: lower });
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "Now send the document file (.pdf or .pptx only).",
    });
    return true;
  }

  return false;
}

async function processDocumentMessage(db, message, session) {
  const chatId = message.chat.id;
  const userId = message.from?.id || chatId;
  if (!isUploaderAllowed(chatId)) {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "You are not allowed to upload notes with this bot.",
    });
    return;
  }

  const document = message.document;
  if (!document?.file_id || !isAllowedDocument(document)) {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "Only .pdf and .pptx documents are accepted.",
    });
    return;
  }

  if (!session || session.step !== "await_document") {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: "Start upload flow first with /upload",
    });
    return;
  }

  const data = session.data || {};
  const classification =
    data.scope === "class"
      ? {
          scope: "class",
          classKey: data.classKey,
          subjectKey: data.subjectKey,
          classificationLabel: `${data.classKey} / ${data.subjectKey}`,
        }
      : {
          scope: "course",
          courseKey: data.courseKey,
          semesterKey: data.semesterKey,
          subjectKey: data.subjectKey,
          classificationLabel: `${data.courseKey} / ${data.semesterKey} / ${data.subjectKey}`,
        };

  const fileData = await telegramRequest("getFile", { file_id: document.file_id });
  const filePath = fileData?.result?.file_path;
  if (!filePath) throw new Error("Failed to resolve Telegram file path");

  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const fileRes = await fetch(`${TELEGRAM_API_BASE}/file/bot${botToken}/${filePath}`);
  if (!fileRes.ok) throw new Error("Failed to download file from Telegram");

  const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
  const drive = await uploadToDrive({
    fileBuffer,
    fileName: document.file_name || "note-upload",
    mimeType: document.mime_type,
    classification,
  });

  const uploader = buildUploaderId(message);
  const title = `${data.chapter} - ${data.topic}`;

  await insertNoteDoc({
    classification,
    driveLink: drive.webViewLink,
    title,
    chapter: data.chapter,
    noteKind: data.noteKind,
    uploader,
  });

  await clearSession(db, chatId, userId);
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text: `Uploaded and classified.\nPath: ${classification.classificationLabel}\nTitle: ${title}\nDrive: ${drive.webViewLink}`,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (configuredSecret && incomingSecret !== configuredSecret) {
      return res.status(401).json({ message: "Unauthorized webhook call" });
    }

    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true, ignored: true });
    }
    const db = await connectToDB();
    const chatId = message.chat.id;
    const userId = message.from?.id || chatId;
    const text = String(message.text || "").trim();
    const lowerText = text.toLowerCase();
    const session = await getSession(db, chatId, userId);

    if (["/start", "/app", "/webapp"].includes(lowerText)) {
      const webAppUrl = getRequiredEnv("TELEGRAM_WEB_APP_URL");
      const launchMessage = buildLaunchMessage(webAppUrl);
      await telegramRequest("sendMessage", {
        chat_id: message.chat.id,
        ...launchMessage,
      });
      return res.status(200).json({ ok: true, type: "launch" });
    }

    if (lowerText === "/upload") {
      await startUploadFlow(db, message);
      return res.status(200).json({ ok: true, type: "upload_start" });
    }

    if (lowerText === "/cancel") {
      await clearSession(db, chatId, userId);
      await telegramRequest("sendMessage", { chat_id: chatId, text: "Upload flow cancelled." });
      return res.status(200).json({ ok: true, type: "cancel" });
    }

    if (text && (await processFlowText(db, message, session, text))) {
      return res.status(200).json({ ok: true, type: "flow_step" });
    }

    if (message.document) {
      await processDocumentMessage(db, message, session);
      return res.status(200).json({ ok: true, type: "document" });
    }

    if (lowerText === "/help") {
      await telegramRequest("sendMessage", {
        chat_id: message.chat.id,
        text:
          "Commands:\n/start - open mini app\n/upload - guided upload flow\n/cancel - cancel current upload\n/help - show help\n\nOnly .pdf and .pptx documents are accepted.",
      });
      return res.status(200).json({ ok: true, type: "help" });
    }

    return res.status(200).json({ ok: true, ignored: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(500).json({ message: "Failed to process Telegram webhook" });
  }
}
