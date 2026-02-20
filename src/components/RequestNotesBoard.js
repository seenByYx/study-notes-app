"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./RequestNotesBoard.module.css";

export default function RequestNotesBoard({ scope, classKey, courseKey, semesterKey, subjectKey }) {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ scope, subjectKey, status: "open", limit: "8" });
    if (classKey) params.set("classKey", classKey);
    if (courseKey) params.set("courseKey", courseKey);
    if (semesterKey) params.set("semesterKey", semesterKey);
    return params.toString();
  }, [scope, classKey, courseKey, semesterKey, subjectKey]);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/requests?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load requests");
      setItems(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [query]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = { scope, classKey, courseKey, semesterKey, subjectKey, text };
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit request");
      setText("");
      setMessage(data.message || "Request submitted");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className={styles.panel}>
      <h2>Request Notes</h2>
      <p className={styles.hint}>Missing a chapter or unit? Submit a request for admins.</p>
      {loading && <p className={styles.hint}>Loading requests...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item._id || `${item.text}-${item.createdAt}`} className={styles.item}>
              <div className={styles.body}>{item.text}</div>
              <div className={styles.meta}>votes: {item.voteCount || 0}</div>
            </li>
          ))}
        </ul>
      )}

      {!session?.user && (
        <p className={styles.hint}>
          <Link href="/auth/signin">Sign in</Link> to request notes.
        </p>
      )}

      {session?.user && (
        <form onSubmit={submitRequest} className={styles.form}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Example: Unit 3 short notes + PYQs"
            required
          />
          {message && <p className={styles.success}>{message}</p>}
          <div className={styles.actions}>
            <button type="submit">Submit Request</button>
          </div>
        </form>
      )}
    </section>
  );
}
