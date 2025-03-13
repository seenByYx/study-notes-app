"use client";
import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export default function RootLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="ca-pub-6137752235774964" />
        <meta name="google-adsense-account" content="ca-pub-6137752235774964" />
        <title>microo!</title>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6137752235774964"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo">
            <span>
              microo! <sub>(beta)</sub>
            </span>
          </div>

{/* Hamburger Menu */}
<div className="hamburger" onClick={toggleMenu}>
  {isMenuOpen ? "✖" : "☰"} {/* Changes icon when menu is open */}
</div>

{/* Overlay when menu is open */}
{isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

{/* Nav Links */}
<ul className={`nav-links ${isMenuOpen ? "show" : ""}`}>
  <li>
    <Link href="/" onClick={() => {toggleMenu();}}>Home</Link>  {/* toggleMenu only when clicked */}
  </li>
  <li>
    <Link href="/about" onClick={() => {toggleMenu();}}>About</Link>
  </li>
  <li>
    <Link href="/contact" onClick={() => {toggleMenu();}}>Contact</Link>
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
                <a href="#" target="_blank" rel="noopener noreferrer">Telegram</a>
                <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
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
  );
}
