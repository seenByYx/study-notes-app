"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { AiFillHome, AiOutlineInfoCircle, AiFillPhone } from "react-icons/ai";
import { FaTelegramPlane, FaTwitter, FaInstagram } from "react-icons/fa";
import "./globals.css"; // Ensure this imports your CSS variables

export default function RootLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.add("light");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.remove("light");
    }
  }, []);

  // Toggle between dark and light modes
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("light", newTheme);
  };

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <html lang="en" className={isDarkMode ? "" : "light"}>
      <head>
        <meta name="google-site-verification" content="ca-pub-6137752235774964"></meta>
        <meta name="google-adsense-account" content="ca-pub-6137752235774964"></meta>
        <title>microo!</title>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6137752235774964"
     crossorigin="anonymous"></script>
      </head>
      <body>
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo">
            <span>
              microo! <sub>(beta)</sub>
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {/* Hamburger Menu */}
          <div className="hamburger" onClick={toggleMenu}>
            {isMenuOpen ? "✖" : "☰"}
          </div>

          {/* Overlay when menu is open */}
          {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

          {/* Nav Links */}
          <ul className={`nav-links ${isMenuOpen ? "show" : ""}`}>
            <div className="links">
              <li>
                <Link href="/" onClick={toggleMenu}>
                  <AiFillHome className="nav-icon" /> Home
                </Link>
              </li>
              <li>
                <Link href="/about" onClick={toggleMenu}>
                  <AiOutlineInfoCircle className="nav-icon" /> About
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={toggleMenu}>
                  <AiFillPhone className="nav-icon" /> Contact
                </Link>
              </li>
            </div>
          </ul>
        </nav>

        {/* Content */}
        <div className="content">{children}</div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Quick Links</h4>
              <Link href="/">
                <AiFillHome className="footer-icon" /> Home
              </Link>
              <Link href="/about">
                <AiOutlineInfoCircle className="footer-icon" /> About
              </Link>
              <Link href="/contact">
                <AiFillPhone className="footer-icon" /> Contact
              </Link>
            </div>

            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <FaTelegramPlane className="footer-icon" /> Telegram
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <FaTwitter className="footer-icon" /> Twitter
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <FaInstagram className="footer-icon" /> Instagram
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
  );
}