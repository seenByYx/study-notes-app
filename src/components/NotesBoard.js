"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./NotesBoard.module.css";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}

export default function NotesBoard({
  title,
  scope,
  classKey,
  courseKey,
  semesterKey,
  subjectKey,
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManage = role === "admin" || role === "owner";
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    title: "",
    url: "",
    type: "link",
  });

  const query = useMemo(() => {
    const params = new URLSearchParams({
      scope,
      subjectKey,
    });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    return params.toString();
  }, [scope, subjectKey, classKey, courseKey, semesterKey]);

  const clearForm = () => {
    setForm({ title: "", url: "", type: "link" });
    setEditingId("");
  };

  const loadNotes = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/notes?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notes");
      setNotes(data.notes || []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [query]);

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
      await loadNotes();
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
      url: note.url || "",
      type: note.type || "link",
    });
  };

  const deleteNote = async (id) => {
    setError("");
    setMessage("");
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
      await loadNotes();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      <p className={styles.hint}>Open any item to view its PDF, Drive file, or external resource.</p>

      {loading && <p className={styles.hint}>Loading notes...</p>}
      {!loading && notes.length === 0 && <div className={styles.empty}>No notes uploaded yet.</div>}

      {!loading && notes.length > 0 && (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note._id || `${note.title}-${note.url}`} className={styles.item}>
              <div>
                <a href={note.url} target="_blank" rel="noopener noreferrer">
                  {note.title}
                </a>
                <div className={styles.meta}>
                  Added {formatDate(note.createdAt)} {note.createdBy ? `by ${note.createdBy}` : ""}
                </div>
              </div>
              <div className={styles.actions}>
                <span className={styles.tag}>{note.type || "link"}</span>
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

      {canManage && (
        <div className={styles.admin}>
          <h3>{editingId ? "Edit Note" : "Add Note"}</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              name="title"
              placeholder="Note title"
              value={form.title}
              onChange={handleChange}
              required
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
                <option value="link">Link</option>
                <option value="drive">Drive</option>
                <option value="pdf">PDF</option>
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
