"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { catalog } from "../../../../utils/catalog";

export default function ClassPage() {
  const params = useParams();
  const classKey = String(params.class || "");
  const classData = catalog.classes[classKey];

  if (!classData) {
    return <p className="error-text">Class not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{classData.label}</h1>
        <p>Select a subject to view notes.</p>
      </section>

      <section className="card">
        <ul className="sub-list">
          {classData.subjects.map((subject) => (
            <li key={subject.key}>
              <Link href={`/classes/${classKey}/${subject.key}`}>{subject.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
