"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <section className="auth-wrap">
      <h1>Sign in</h1>
      <p className="muted">Use your account to access notes. Admins can upload links.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit">{loading ? "Signing in..." : "Sign in"}</button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>
      <button
        type="button"
        className="oauth-button"
        onClick={handleGoogleSignIn}
        disabled={oauthLoading}
      >
        {oauthLoading ? "Connecting..." : "Continue with Google"}
      </button>

      <p className="muted">
        New account? <Link href="/auth/signup">Create one</Link>
      </p>
    </section>
  );
}
