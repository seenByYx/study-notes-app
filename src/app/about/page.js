import styles from "./About.module.css";

export default function AboutPage() {
  return (
    <div>
      <section className={styles.aboutSection}>
        <div className={styles.container}>
          <h1>About Us</h1>
          <p className={styles.memberDescription}>
            We are three degree students dedicated to providing valuable study resources.
          </p>

          <div className={styles.team}>
            <div className={styles.member}>
              <img src="/images/9408fdd6-ceac-492c-ae79-1d0b65b858e6.jpg" alt="Developer" className={styles.profileImage} />
              <h2 className={styles.teamMemberTitle}>Developer</h2>

              <p>I handle the technical side of the platform, ensuring smooth operation and user experience.</p>
            </div>

            <div className={styles.member}>
              <img src="/images/Lightning McQueen in Pixar Style Wallpaper backgrounds for iPhone, Desktop, PC, Laptop, Compute___.jpg" alt="Marketing" className={styles.profileImage} />
              <h2 className={styles.teamMemberTitle}>Marketing</h2>

              <p>Our marketing expert makes sure that students know about us and have access to the right study materials.</p>
            </div>

            <div className={styles.member}>
              <img src="/images/wp5894291-minimalist-cyberpunk-wallpapers.jpg" alt="PDF Creator" className={styles.profileImage} />
              <h2 className={styles.teamMemberTitle}>Content Specialist</h2>

              <p>Creating high-quality, concise PDFs and notes that focus on what matters the most during exams.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
