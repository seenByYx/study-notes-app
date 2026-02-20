"use client";

import { useParams } from "next/navigation";
import NotesBoard from "../../../../../components/NotesBoard";
import CommentsBoard from "../../../../../components/CommentsBoard";
import { catalog } from "../../../../../../utils/catalog";

export default function CourseSubjectPage() {
  const params = useParams();
  const courseKey = String(params.course || "");
  const semesterKey = String(params.semester || "");
  const subjectKey = String(params.subject || "");

  const courseData = catalog.courses[courseKey];
  const semesterData = courseData?.semesters?.[semesterKey];
  const subjectData = semesterData?.subjects?.find((subject) => subject.key === subjectKey);

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
    </div>
  );
}
