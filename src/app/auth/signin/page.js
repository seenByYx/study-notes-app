"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");

  const handleSignIn = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    await signIn("email", { email });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Sign In</h1>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "10px",
          margin: "10px 0",
          width: "300px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />
      <br />
      <button
        onClick={handleSignIn}
        style={{
          padding: "10px 20px",
          background: "#2ECC71",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Sign In with Email
      </button>
    </div>
  );
}