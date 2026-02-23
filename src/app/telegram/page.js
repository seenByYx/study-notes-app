"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TelegramPage() {
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe?.user) {
      setTelegramUser(tg.initDataUnsafe.user);
    }
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div className="page-stack">
        <section className="hero">
          <h1>Study Notes Mini App</h1>
          <p>Opened inside Telegram. Use this page like the normal web app.</p>
        </section>

        <section className="card">
          {telegramUser ? (
            <p>
              Signed in Telegram user: <strong>{telegramUser.first_name}</strong>
            </p>
          ) : (
            <p className="muted">Telegram context not detected. Open this page from your Telegram bot.</p>
          )}
          <p style={{ marginTop: 12 }}>
            <Link href="/">Continue to Study Notes</Link>
          </p>
        </section>
      </div>
    </>
  );
}
