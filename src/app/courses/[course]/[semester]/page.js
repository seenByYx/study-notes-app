"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { catalog } from "../../../../../utils/catalog";

export default function SemesterPage() {
  const params = useParams();
  const courseKey = String(params.course || "");
  const semesterKey = String(params.semester || "");
  const [customSubjects, setCustomSubjects] = useState([]);

  const courseData = catalog.courses[courseKey];
  const semesterData = courseData?.semesters?.[semesterKey];
  const subjects = useMemo(() => {
    const map = new Map();
    (semesterData?.subjects || []).forEach((item) => {
      if (item?.key && !map.has(item.key)) map.set(item.key, item);
    });
    customSubjects.forEach((item) => {
      if (item?.key && !map.has(item.key)) map.set(item.key, item);
    });
    return Array.from(map.values());
  }, [semesterData?.subjects, customSubjects]);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomSubjects() {
      if (!courseKey || !semesterKey) return;
      try {
        const query = new URLSearchParams({
          scope: "course",
          courseKey,
          semesterKey,
        });
        const res = await fetch(`/api/subjects?${query.toString()}`);
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setCustomSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      } catch {
        if (!cancelled) setCustomSubjects([]);
      }
    }
    loadCustomSubjects();
    return () => {
      cancelled = true;
    };
  }, [courseKey, semesterKey]);

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
        {subjects.length === 0 && <p className="muted">No subjects configured yet.</p>}
        {subjects.length > 0 && (
          <ul className="sub-list">
            {subjects.map((subject) => (
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
