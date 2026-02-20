"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { catalog } from "../../../../utils/catalog";

export default function CoursePage() {
  const params = useParams();
  const courseKey = String(params.course || "");
  const courseData = catalog.courses[courseKey];

  if (!courseData) {
    return <p className="error-text">Course not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{courseData.label}</h1>
        <p>Select a semester.</p>
      </section>

      <section className="card">
        <ul className="sub-list">
          {Object.entries(courseData.semesters).map(([semesterKey, semesterData]) => (
            <li key={semesterKey}>
              <Link href={`/courses/${courseKey}/${semesterKey}`}>{semesterData.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
