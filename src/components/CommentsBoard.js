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
  const [repliesByParent, setRepliesByParent] = useState({});
  const [expandedParents, setExpandedParents] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  const buildScopeQuery = () => {
    const params = new URLSearchParams({ scope, subjectKey, limit: "10" });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    return params;
  };

  const baseQuery = useMemo(() => {
    const params = buildScopeQuery();
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

  const loadReplies = async (parentId) => {
    try {
      const params = buildScopeQuery();
      params.set("parentId", parentId);
      params.set("limit", "25");
      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load replies");
      setRepliesByParent((prev) => ({ ...prev, [parentId]: data.comments || [] }));
    } catch (replyError) {
      setError(replyError.message);
    }
  };

  const toggleReplies = async (parentId) => {
    const isOpen = Boolean(expandedParents[parentId]);
    if (isOpen) {
      setExpandedParents((prev) => ({ ...prev, [parentId]: false }));
      return;
    }
    setExpandedParents((prev) => ({ ...prev, [parentId]: true }));
    if (!repliesByParent[parentId]) {
      await loadReplies(parentId);
    }
  };

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
      parentId: null,
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

  const handleReplySubmit = async (parentId) => {
    const replyText = String(replyDrafts[parentId] || "").trim();
    if (!replyText) return;
    setError("");
    setMessage("");
    try {
      const payload = {
        text: replyText,
        parentId,
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
      if (!res.ok) throw new Error(data.message || "Failed to reply");
      setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
      await loadReplies(parentId);
      setExpandedParents((prev) => ({ ...prev, [parentId]: true }));
      setMessage("Reply added.");
    } catch (replyError) {
      setError(replyError.message);
    }
  };

  const handleDelete = async (id, parentId = "") => {
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
      if (parentId) {
        await loadReplies(parentId);
      } else {
        await fetchPage({ nextPage: 1, append: false });
      }
      setMessage("Comment deleted.");
    } catch (deleteError) {
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

  const renderComment = (comment, isReply = false, parentId = "") => (
    <li
      key={comment._id || `${comment.createdAt}-${comment.createdById}`}
      className={`${styles.item} ${isReply ? styles.replyItem : ""}`}
    >
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
        {!isReply && session?.user && (
          <button type="button" className={styles.replyButton} onClick={() => toggleReplies(comment._id)}>
            {expandedParents[comment._id] ? "Hide Replies" : "Reply"}
          </button>
        )}
        {!canModerate && session?.user && (
          <button type="button" className={styles.reportButton} onClick={() => handleReport(comment._id)}>
            Report
          </button>
        )}
        {canModerate && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => handleDelete(comment._id, parentId)}
          >
            Delete
          </button>
        )}
      </div>

      {!isReply && expandedParents[comment._id] && (
        <div className={styles.repliesWrap}>
          <ul className={styles.replyList}>
            {(repliesByParent[comment._id] || []).map((reply) => renderComment(reply, true, comment._id))}
          </ul>
          {session?.user && (
            <div className={styles.replyComposer}>
              <input
                placeholder="Write a reply..."
                value={replyDrafts[comment._id] || ""}
                onChange={(event) =>
                  setReplyDrafts((prev) => ({ ...prev, [comment._id]: event.target.value }))
                }
              />
              <button type="button" className={styles.replyButton} onClick={() => handleReplySubmit(comment._id)}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );

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

      {!loading && comments.length > 0 && <ul className={styles.list}>{comments.map((comment) => renderComment(comment))}</ul>}

      {!loading && hasMore && (
        <div className={styles.rowEnd}>
          <button
            type="button"
            className={styles.reportButton}
            disabled={loadingMore}
            onClick={() => fetchPage({ nextPage: page + 1, append: true })}
          >
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
