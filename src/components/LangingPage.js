"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/"); // Redirect to home page
    }, 3000); // 3 seconds

    return () => clearTimeout(timer); // Cleanup timer
  }, [router]);

  return (
    <div className="landing-page">
      <h1>microo!</h1>
    </div>
  );
}