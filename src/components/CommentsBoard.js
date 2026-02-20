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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({ scope, subjectKey, limit: "10" });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    if (query.trim()) params.set("q", query.trim());
    return params;
  }, [scope, subjectKey, classKey, courseKey, semesterKey, query]);

  const fetchPage = async ({ nextPage = 1, append = false }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(baseQuery);
      params.set("page", String(nextPage));
      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load comments");
      setComments((prev) => (append ? [...prev, ...(data.comments || [])] : data.comments || []));
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
  }, [baseQuery.toString()]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      createdBy: session?.user?.name || "You",
      createdByImage: session?.user?.image || null,
      createdById: session?.user?.id || "local",
    };
    setComments((prev) => [optimistic, ...prev]);
    setText("");

    try {
      const payload = { text, scope, classKey, courseKey, semesterKey, subjectKey };
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add comment");
      setMessage("Comment added.");
      await fetchPage({ nextPage: 1, append: false });
    } catch (submitError) {
      setComments((prev) => prev.filter((item) => item._id !== optimistic._id));
      setError(submitError.message);
      setText(optimistic.text);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");
    const previous = comments;
    setComments((prev) => prev.filter((item) => item._id !== id));
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete comment");
      setMessage("Comment deleted.");
    } catch (deleteError) {
      setComments(previous);
      setError(deleteError.message);
    }
  };

  const handleReport = async (id) => {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "report" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to report comment");
      setMessage("Comment reported.");
    } catch (reportError) {
      setError(reportError.message);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>{title}</h2>
        <span className={styles.count}>{comments.length}</span>
      </div>
      <p className={styles.hint}>Share questions or clarifications for this topic.</p>
      <input placeholder="Search comments..." value={query} onChange={(event) => setQuery(event.target.value)} />

      {loading && (
        <div className={styles.skeletonWrap}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}
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
              <div className={styles.rowEnd}>
                {!canModerate && session?.user && (
                  <button type="button" className={styles.reportButton} onClick={() => handleReport(comment._id)}>
                    Report
                  </button>
                )}
                {canModerate && (
                  <button type="button" className={styles.deleteButton} onClick={() => handleDelete(comment._id)}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && hasMore && (
        <div className={styles.rowEnd}>
          <button type="button" className={styles.reportButton} disabled={loadingMore} onClick={() => fetchPage({ nextPage: page + 1, append: true })}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
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
