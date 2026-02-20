"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./OwnerPanel.module.css";

export default function OwnerPanel() {
  const [users, setUsers] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load users");
    setUsers(data.users || []);
  };

  const loadReportedComments = async () => {
    const res = await fetch("/api/comments?status=reported&limit=10");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load reported comments");
    setReportedComments(data.comments || []);
  };

  const loadRequests = async () => {
    const res = await fetch("/api/requests?status=open&limit=10");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load note requests");
    setRequests(data.requests || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadUsers(), loadReportedComments(), loadRequests()]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const admins = useMemo(() => users.filter((user) => user.role === "admin"), [users]);

  const runAction = async (url, payload) => {
    setError("");
    setMessage("");
    try {
      const method = payload.action ? "PATCH" : "DELETE";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      setMessage(data.message || "Done");
      await loadAll();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const promoteByEmail = async () => {
    const email = window.prompt("Enter user email to promote as admin:");
    if (!email) return;
    await runAction("/api/users", { action: "promote_by_email", email });
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3>Owner Console</h3>
        <button type="button" onClick={promoteByEmail}>
          Promote Admin
        </button>
      </div>
      <p className="muted">Manage admins, comment moderation, and note requests.</p>

      {loading && <p className="muted">Loading dashboard...</p>}
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {!loading && (
        <div className={styles.sections}>
          <div className={styles.block}>
            <h4>Admins</h4>
            {admins.length === 0 && <p className="muted">No admins yet.</p>}
            {admins.length > 0 && (
              <ul className={styles.list}>
                {admins.map((user) => (
                  <li key={user._id} className={styles.item}>
                    <div>
                      <strong>{user.name || "User"}</strong> ({user.email})
                    </div>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => runAction("/api/users", { action: "demote_admin", userId: user._id })}>
                        Demote
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.block}>
            <h4>Reported Comments</h4>
            {reportedComments.length === 0 && <p className="muted">No reported comments.</p>}
            {reportedComments.length > 0 && (
              <ul className={styles.list}>
                {reportedComments.map((comment) => (
                  <li key={comment._id} className={styles.item}>
                    <div>{comment.text}</div>
                    <div className={styles.meta}>
                      reports: {comment.reportCount || 0} | by: {comment.createdBy || "User"}
                    </div>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => runAction("/api/comments", { action: "resolve", id: comment._id })}>
                        Restore
                      </button>
                      <button type="button" className={styles.danger} onClick={() => runAction("/api/comments", { id: comment._id })}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.block}>
            <h4>Note Requests</h4>
            {requests.length === 0 && <p className="muted">No open requests.</p>}
            {requests.length > 0 && (
              <ul className={styles.list}>
                {requests.map((request) => (
                  <li key={request._id} className={styles.item}>
                    <div>{request.text}</div>
                    <div className={styles.meta}>votes: {request.voteCount || 0}</div>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => runAction("/api/requests", { action: "fulfill", id: request._id })}>
                        Mark Fulfilled
                      </button>
                      <button type="button" className={styles.danger} onClick={() => runAction("/api/requests", { action: "reject", id: request._id })}>
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
