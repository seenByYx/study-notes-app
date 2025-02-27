"use client";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head"; // Import Head from next/head
import "./globals.css";

export default function RootLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <Head>
        <meta name="google-site-verification" content="ca-pub-6137752235774964" />
        <meta name="google-adsense-account" content="ca-pub-6137752235774964" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6137752235774964"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <html lang="en">
        <body>
          {/* Navbar */}
          <nav className="navbar">
            <div className="logo">
              <span>microo!</span>
            </div>

            {/* Hamburger Menu */}
            <div className="hamburger" onClick={toggleMenu}>
              &#9776;
            </div>

            {/* Nav Links */}
            <ul className={`nav-links ${isMenuOpen ? "open" : ""}`}>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </nav>

          {/* Content Area */}
          <div className="content">{children}</div>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <div className="footer-section">
                <h4>Quick Links</h4>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
              </div>

              <div className="footer-section">
                <h4>Follow Us</h4>
                <div className="social-icons">
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Telegram
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </div>
              </div>

              <div className="footer-section">
                <h4>Contact</h4>
                <p>Email: support@microo.com</p>
                <p>Phone: +91 813 709 7085</p>
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; 2025 microo! All rights reserved.</p>
            </div>
          </footer>
        </body>
      </html>
    </>
  );
}
