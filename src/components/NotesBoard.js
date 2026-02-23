"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./NotesBoard.module.css";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

const NOTE_KIND_OPTIONS = [
  { value: "notes", label: "Notes" },
  { value: "question-paper", label: "Question Paper" },
  { value: "assignment", label: "Assignment" },
  { value: "reference", label: "Reference" },
];

export default function NotesBoard({
  title,
  scope,
  classKey,
  courseKey,
  semesterKey,
  subjectKey,
  allowManage = false,
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManage = allowManage && (role === "admin" || role === "owner");
  const canRate = Boolean(session?.user);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [form, setForm] = useState({
    title: "",
    chapter: "",
    noteKind: "notes",
    tags: "",
    url: "",
    type: "drive",
  });

  const queryBase = useMemo(() => {
    const params = new URLSearchParams({
      scope,
      subjectKey,
      limit: "12",
      sort,
    });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    if (search.trim()) params.set("q", search.trim());
    return params;
  }, [scope, subjectKey, classKey, courseKey, semesterKey, search, sort]);

  const clearForm = () => {
    setForm({ title: "", chapter: "", noteKind: "notes", tags: "", url: "", type: "drive" });
    setEditingId("");
  };

  const fetchPage = async ({ nextPage = 1, append = false }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams(queryBase);
      params.set("page", String(nextPage));
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notes");
      setNotes((prev) => (append ? [...prev, ...(data.notes || [])] : data.notes || []));
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage({ nextPage: 1, append: false });
  }, [queryBase.toString()]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        scope,
        classKey,
        courseKey,
        semesterKey,
        subjectKey,
      };

      const isEdit = Boolean(editingId);
      const res = await fetch("/api/notes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save note");

      clearForm();
      setMessage(isEdit ? "Note updated" : "Note added");
      await fetchPage({ nextPage: 1, append: false });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const startEdit = (note) => {
    setMessage("");
    setError("");
    setEditingId(note._id);
    setForm({
      title: note.title || "",
      chapter: note.chapter || "",
      noteKind: note.noteKind || "notes",
      tags: Array.isArray(note.tags) ? note.tags.join(", ") : "",
      url: note.url || "",
      type: note.type || "drive",
    });
  };

  const deleteNote = async (id) => {
    const confirmed = window.confirm("Delete this uploaded note? This cannot be undone.");
    if (!confirmed) return;
    setError("");
    setMessage("");
    const previous = notes;
    setNotes((current) => current.filter((item) => item._id !== id));
    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete note");
      if (editingId === id) clearForm();
      setMessage("Note deleted");
    } catch (deleteError) {
      setNotes(previous);
      setError(deleteError.message);
    }
  };

  const trackOpen = async (id) => {
    fetch("/api/notes/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setNotes((prev) =>
      prev.map((note) => (note._id === id ? { ...note, openCount: Number(note.openCount || 0) + 1 } : note))
    );
  };

  const rateNote = async (id, value) => {
    if (!canRate) {
      setError("Sign in to rate notes");
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/notes/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to rate");
      await fetchPage({ nextPage: 1, append: false });
    } catch (rateError) {
      setError(rateError.message);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headerRow}>
        <h2>{title}</h2>
        <div className={styles.filters}>
          <input
            placeholder="Search titles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Recent</option>
            <option value="most_opened">Most opened</option>
            <option value="top_rated">Top rated</option>
          </select>
        </div>
      </div>
      <p className={styles.hint}>Open any item to view its PDF, Drive file, or external resource.</p>

      {loading && (
        <div className={styles.skeletonWrap}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}
      {!loading && notes.length === 0 && <div className={styles.empty}>No notes uploaded yet.</div>}

      {!loading && notes.length > 0 && (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note._id || `${note.title}-${note.url}`} className={styles.item}>
              <div>
                <a href={note.url} target="_blank" rel="noopener noreferrer" onClick={() => trackOpen(note._id)}>
                  {note.title}
                </a>
                <div className={styles.meta}>
                  {note.chapter ? `${note.chapter} | ` : ""}
                  {note.noteKind || "notes"} | opens: {note.openCount || 0} | score: {note.ratingScore || 0}
                </div>
                <div className={styles.meta}>
                  Added {formatDate(note.createdAt)} {note.createdBy ? `by ${note.createdBy}` : ""}
                </div>
              </div>
              <div className={styles.actions}>
                <span className={styles.tag}>{note.type || "link"}</span>
                <button type="button" className={styles.secondary} onClick={() => rateNote(note._id, 5)}>
                  Rate 5
                </button>
                {canManage && (
                  <>
                    <button type="button" className={styles.secondary} onClick={() => startEdit(note)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteNote(note._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && hasMore && (
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} disabled={loadingMore} onClick={() => fetchPage({ nextPage: page + 1, append: true })}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {canManage && (
        <div className={styles.admin}>
          <h3>{editingId ? "Edit Note" : "Add Note"}</h3>
          <p className={styles.hint}>Template: `Chapter - Topic`</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              name="title"
              placeholder="Example: Unit 2 - Boolean Algebra"
              value={form.title}
              onChange={handleChange}
              required
            />
            <div className={styles.inline}>
              <input
                name="chapter"
                placeholder="Chapter / Unit"
                value={form.chapter}
                onChange={handleChange}
                required
              />
              <select name="noteKind" value={form.noteKind} onChange={handleChange}>
                {NOTE_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="tags"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={handleChange}
            />
            <div className={styles.inline}>
              <input
                name="url"
                placeholder="Drive link or file URL"
                value={form.url}
                onChange={handleChange}
                required
              />
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="drive">Drive</option>
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
              </select>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}
            <div className={styles.actions}>
              {editingId && (
                <button type="button" className={styles.secondary} onClick={clearForm}>
                  Cancel
                </button>
              )}
              <button type="submit">{editingId ? "Save Changes" : "Upload Note"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
