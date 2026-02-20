"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    requestAdmin: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create account");
      router.push("/auth/signin");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <h1>Create account</h1>
      <p className="muted">Accounts start as user. Owner approves admin access.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <label className="row-between">
          <span>Request admin access</span>
          <input
            name="requestAdmin"
            type="checkbox"
            checked={form.requestAdmin}
            onChange={handleChange}
            style={{ width: "18px", height: "18px" }}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit">{loading ? "Creating..." : "Create account"}</button>
      </form>

      <p className="muted">
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
    </section>
  );
}
