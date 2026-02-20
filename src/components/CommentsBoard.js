"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./CommentsBoard.module.css";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function getInitial(name) {
  const safe = String(name || "User").trim();
  return safe.charAt(0).toUpperCase() || "U";
}

function formatDisplayName(name) {
  const safe = String(name || "User").trim();
  if (safe.includes("@")) return safe.split("@")[0];
  return safe;
}

export default function CommentsBoard({
  title = "Comments",
  scope,
  classKey,
  courseKey,
  semesterKey,
  subjectKey,
}) {
  const { data: session } = useSession();
  const canModerate = session?.user?.role === "owner" || session?.user?.role === "admin";
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ scope, subjectKey });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    return params.toString();
  }, [scope, subjectKey, classKey, courseKey, semesterKey]);

  const loadComments = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/comments?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load comments");
      setComments(data.comments || []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        text,
        scope,
        classKey,
        courseKey,
        semesterKey,
        subjectKey,
      };

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add comment");

      setText("");
      setMessage("Comment added.");
      await loadComments();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete comment");
      setMessage("Comment deleted.");
      await loadComments();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <span className={styles.count}>{comments.length}</span>
      </div>
      <p className={styles.hint}>Share questions or clarifications for this topic.</p>

      {loading && <p className={styles.hint}>Loading comments...</p>}
      {!loading && comments.length === 0 && <div className={styles.empty}>No comments yet.</div>}

      {!loading && comments.length > 0 && (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment._id || `${comment.createdAt}-${comment.createdById}`} className={styles.item}>
              <div className={styles.head}>
                {comment.createdByImage ? (
                  <img className={styles.avatarImage} src={comment.createdByImage} alt={comment.createdBy || "User"} />
                ) : (
                  <div className={styles.avatarFallback}>{getInitial(comment.createdBy)}</div>
                )}
                <div className={styles.meta}>
                  {formatDisplayName(comment.createdBy)} | {formatDate(comment.createdAt)}
                </div>
              </div>
              <div className={styles.body}>{comment.text}</div>
              {canModerate && (
                <div className={styles.rowEnd}>
                  <button type="button" className={styles.deleteButton} onClick={() => handleDelete(comment._id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.formWrap}>
        {!session?.user && (
          <p className={styles.notice}>
            <Link href="/auth/signin">Sign in</Link> to leave a comment.
          </p>
        )}

        {session?.user && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <textarea
              name="comment"
              rows={3}
              placeholder="Add a comment"
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
            />
            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}
            <div className={styles.actions}>
              <button type="submit">Post comment</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
