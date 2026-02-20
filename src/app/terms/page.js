export default function TermsPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Terms of Use</h1>
        <p>Last updated: February 20, 2026</p>
      </section>

      <section className="card">
        <h3>Acceptance of Terms</h3>
        <p className="muted">
          By accessing or using microo, you agree to these Terms. If you do not agree, do not use the service.
        </p>
      </section>

      <section className="card">
        <h3>User Accounts</h3>
        <ul className="list">
          <li>You are responsible for your account and activities under it.</li>
          <li>Provide accurate information and keep login credentials secure.</li>
          <li>Owner/admin roles are managed by platform moderation controls.</li>
        </ul>
      </section>

      <section className="card">
        <h3>Content and Conduct</h3>
        <ul className="list">
          <li>Do not post harmful, illegal, or infringing content.</li>
          <li>Do not spam, abuse, or attempt to disrupt the platform.</li>
          <li>Reported or violating content may be removed without notice.</li>
        </ul>
      </section>

      <section className="card">
        <h3>Intellectual Property</h3>
        <p className="muted">
          Users must have the right to share links/content they post. microo may remove material upon valid complaint.
        </p>
      </section>

      <section className="card">
        <h3>Service Availability</h3>
        <p className="muted">
          We may modify, suspend, or discontinue features at any time to maintain reliability, security, or compliance.
        </p>
      </section>

      <section className="card">
        <h3>Limitation of Liability</h3>
        <p className="muted">
          The service is provided as-is without warranties. We are not liable for indirect or consequential damages
          from use of the platform.
        </p>
      </section>

      <section className="card">
        <h3>Changes to Terms</h3>
        <p className="muted">
          We may update these Terms over time. Continued use after updates means you accept the revised Terms.
        </p>
      </section>
    </div>
  );
}
