import styles from './Contact.module.css'; // For styling

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <section className={styles.contactSection}>
        <h1>Meet the Team</h1>
        <p>These are the experts behind the service. Get in touch with any of them!</p>
        
        <div className={styles.team}>
          {/* Person 1 */}
          <div className={styles.teamMember}>
            <img src="/images/person1.jpg" alt="Person 1" className={styles.profileImage} />
            <h2>Shiyad EK</h2>
            <p>Content Specialist</p>
            <a href="mailto:john.doe@example.com" className={styles.contactLink}>Email Shiyad</a>
          </div>

          {/* Person 2 */}
          <div className={styles.teamMember}>
            <img src="/images/person2.jpg" alt="Person 2" className={styles.profileImage} />
            <h2>Yaseen</h2>
            <p>Developer</p>
            <a href="yxseen.email@gmail.com" className={styles.contactLink}>Email Yaseen</a>
          </div>

          {/* Person 3 */}
          <div className={styles.teamMember}>
            <img src="/images/person3.jpg" alt="Person 3" className={styles.profileImage} />
            <h2>Vishnu</h2>
            <p>Marketer</p>
            <a href="mailto:alex.johnson@example.com" className={styles.contactLink}>Email Vishnu</a>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <h1>Contact Us</h1>
        <p>If you have any questions or concerns, feel free to reach out!</p>

        <form className={styles.contactForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Your Name</label>
            <input type="text" id="name" name="name" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Your Email</label>
            <input type="email" id="email" name="email" required />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="message">Your Message</label>
            <textarea id="message" name="message" required></textarea>
          </div>

          <button type="submit" className={styles.submitButton}>Send Message</button>
        </form>
      </section>
    </div>
  );
}
