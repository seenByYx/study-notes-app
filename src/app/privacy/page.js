export default function PrivacyPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: February 20, 2026</p>
      </section>

      <section className="card">
        <h3>Overview</h3>
        <p className="muted">
          This Privacy Policy explains what data microo collects, why it is collected, and how it is used when you
          access study notes, comments, and account features.
        </p>
      </section>

      <section className="card">
        <h3>Information We Collect</h3>
        <ul className="list">
          <li>Account information such as name, email, and profile image.</li>
          <li>Content you create, including comments and note requests.</li>
          <li>Usage data such as note opens, ratings, and moderation actions.</li>
        </ul>
      </section>

      <section className="card">
        <h3>How We Use Data</h3>
        <ul className="list">
          <li>To authenticate users and manage role-based access.</li>
          <li>To provide notes, comments, search, and moderation features.</li>
          <li>To improve quality, detect abuse, and maintain platform safety.</li>
        </ul>
      </section>

      <section className="card">
        <h3>Cookies and Third-Party Services</h3>
        <p className="muted">
          We use authentication/session cookies to keep you signed in. If ads or analytics are enabled, third-party
          providers may set cookies based on their own policies.
        </p>
      </section>

      <section className="card">
        <h3>Data Retention</h3>
        <p className="muted">
          We retain account and activity data as needed to operate the service, comply with legal obligations, and
          enforce platform rules.
        </p>
      </section>

      <section className="card">
        <h3>Your Rights</h3>
        <p className="muted">
          You may request access, correction, or deletion of your account data by contacting support through the
          Contact page.
        </p>
      </section>

      <section className="card">
        <h3>Contact</h3>
        <p className="muted">
          For privacy questions, use the details listed on the Contact page.
        </p>
      </section>
    </div>
  );
}
