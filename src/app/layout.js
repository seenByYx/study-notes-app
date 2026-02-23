"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import "./globals.css";

function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthPage = pathname.startsWith("/auth/");
  const showBackButton = !isAuthPage && pathname !== "/";

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <>
      {!isAuthPage && (
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              microo
            </Link>

            <nav className="site-nav">
              <Link href="/">Home</Link>
              {(session?.user?.role === "admin" || session?.user?.role === "owner") && (
                <Link href="/upload">Upload</Link>
              )}
              <Link href="/contact">Contact</Link>
            </nav>

            <div className="auth-actions">
              {!session?.user && <Link href="/auth/signin">Sign in</Link>}
              {session?.user && (
                <>
                  <span className="role-badge">{session.user.role || "user"}</span>
                  <button type="button" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="container main-content">
        {showBackButton && (
          <div className="back-nav">
            <button type="button" className="back-button" onClick={handleBack}>
              {"< Back"}
            </button>
          </div>
        )}
        {children}
      </main>

      {!isAuthPage && (
        <footer className="site-footer">
          <div className="container footer-row">
            <p>Simple notes sharing for students.</p>
            <p>
              <Link href="/privacy">Privacy Policy</Link> | <Link href="/terms">Terms of Use</Link>
            </p>
          </div>
        </footer>
      )}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
