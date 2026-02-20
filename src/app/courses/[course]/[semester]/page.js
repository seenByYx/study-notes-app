"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { catalog } from "../../../../../utils/catalog";

export default function SemesterPage() {
  const params = useParams();
  const courseKey = String(params.course || "");
  const semesterKey = String(params.semester || "");

  const courseData = catalog.courses[courseKey];
  const semesterData = courseData?.semesters?.[semesterKey];

  if (!courseData || !semesterData) {
    return <p className="error-text">Semester not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>
          {courseData.label} / {semesterData.label}
        </h1>
        <p>Select a subject.</p>
      </section>

      <section className="card">
        {semesterData.subjects.length === 0 && <p className="muted">No subjects configured yet.</p>}
        {semesterData.subjects.length > 0 && (
          <ul className="sub-list">
            {semesterData.subjects.map((subject) => (
              <li key={subject.key}>
                <Link href={`/courses/${courseKey}/${semesterKey}/${subject.key}`}>{subject.label}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
