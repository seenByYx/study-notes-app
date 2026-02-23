"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import NotesBoard from "../../../../../components/NotesBoard";
import CommentsBoard from "../../../../../components/CommentsBoard";
import RequestNotesBoard from "../../../../../components/RequestNotesBoard";
import { catalog } from "../../../../../../utils/catalog";

function toTitleCase(input) {
  return String(input || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CourseSubjectPage() {
  const params = useParams();
  const courseKey = String(params.course || "");
  const semesterKey = String(params.semester || "");
  const subjectKey = String(params.subject || "");
  const [customSubjects, setCustomSubjects] = useState([]);

  const courseData = catalog.courses[courseKey];
  const semesterData = courseData?.semesters?.[semesterKey];
  const subjectData = useMemo(() => {
    const fromCatalog = semesterData?.subjects?.find((subject) => subject.key === subjectKey);
    if (fromCatalog) return fromCatalog;
    const fromCustom = customSubjects.find((subject) => subject.key === subjectKey);
    if (fromCustom) return fromCustom;
    return subjectKey ? { key: subjectKey, label: toTitleCase(subjectKey) } : null;
  }, [semesterData?.subjects, customSubjects, subjectKey]);

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

  if (!courseData || !semesterData || !subjectData) {
    return <p className="error-text">Subject not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{subjectData.label}</h1>
        <p>
          {courseData.label} / {semesterData.label}. Open a note to view the attached file.
        </p>
      </section>

      <NotesBoard
        title={`${courseData.label} / ${semesterData.label} / ${subjectData.label}`}
        scope="course"
        courseKey={courseKey}
        semesterKey={semesterKey}
        subjectKey={subjectKey}
      />

      <CommentsBoard
        scope="course"
        courseKey={courseKey}
        semesterKey={semesterKey}
        subjectKey={subjectKey}
      />

      <RequestNotesBoard
        scope="course"
        courseKey={courseKey}
        semesterKey={semesterKey}
        subjectKey={subjectKey}
      />
    </div>
  );
}
