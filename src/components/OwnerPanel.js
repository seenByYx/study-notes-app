"use client";

import { useEffect, useState } from "react";
import styles from "./OwnerPanel.module.css";

export default function OwnerPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
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

  const runAction = async (userId, action) => {
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  return (
    <section className={styles.panel}>
      <h3>Owner Console</h3>
      <p className="muted">Approve admins and manage users.</p>
      {loading && <p className="muted">Loading users...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && (
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
              {user.role !== "owner" && (
                <div className={styles.actions}>
                  {user.adminRequested && (
                    <button type="button" onClick={() => runAction(user._id, "approve_admin")}>
                      Approve Admin
                    </button>
                  )}
                  <button type="button" onClick={() => runAction(user._id, "set_user")}>
                    Set User
                  </button>
                  <button type="button" onClick={() => runAction(user._id, "set_admin")}>
                    Set Admin
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => runAction(user._id, "delete_user")}
                  >
                    Delete User
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
