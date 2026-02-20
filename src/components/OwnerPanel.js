"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./OwnerPanel.module.css";

export default function OwnerPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load users");
      setUsers(data.users || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const admins = useMemo(() => users.filter((user) => user.role === "admin"), [users]);

  const runAction = async (payload) => {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      setMessage(data.message || "Done");
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const promoteByEmail = async () => {
    const email = window.prompt("Enter user email to promote as admin:");
    if (!email) return;
    await runAction({ action: "promote_by_email", email });
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3>Owner Console</h3>
        <button type="button" onClick={promoteByEmail}>
          Promote Admin
        </button>
      </div>
      <p className="muted">Promote admins by email and demote existing admins.</p>

      {loading && <p className="muted">Loading users...</p>}
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
                      <button type="button" onClick={() => runAction({ action: "demote_admin", userId: user._id })}>
                        Demote
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.block}>
            <h4>All Users</h4>
            <ul className={styles.list}>
              {users.map((user) => (
                <li key={user._id} className={styles.item}>
                  <div>
                    <strong>{user.name || "User"}</strong> ({user.email})
                  </div>
                  <div className={styles.meta}>
                    role: {user.role}
                    {user.adminRequested ? " | admin request pending" : ""}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
