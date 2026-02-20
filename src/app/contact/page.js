export default function ContactPage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Contact</h1>
        <p>Reach out for support and note requests.</p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Email</h3>
          <p className="muted">support@microo.com</p>
        </article>
        <article className="card">
          <h3>Telegram</h3>
          <p className="muted">Telegram user ID: 1971125096</p>
        </article>
        <article className="card">
          <h3>Response Time</h3>
          <p className="muted">Usually within 24 hours.</p>
        </article>
      </section>
    </div>
  );
}
