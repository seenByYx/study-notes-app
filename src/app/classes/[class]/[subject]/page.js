"use client";

import { useParams } from "next/navigation";
import NotesBoard from "../../../../components/NotesBoard";
import CommentsBoard from "../../../../components/CommentsBoard";
import RequestNotesBoard from "../../../../components/RequestNotesBoard";
import { catalog } from "../../../../../utils/catalog";

export default function ClassSubjectPage() {
  const params = useParams();
  const classKey = String(params.class || "");
  const subjectKey = String(params.subject || "");

  const classData = catalog.classes[classKey];
  const subjectData = classData?.subjects?.find((subject) => subject.key === subjectKey);

  if (!classData || !subjectData) {
    return <p className="error-text">Subject not found.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>{subjectData.label}</h1>
        <p>
          {classData.label} notes. Click any note to open PDF/Drive file in a new tab.
        </p>
      </section>

      <NotesBoard
        title={`${classData.label} / ${subjectData.label}`}
        scope="class"
        classKey={classKey}
        subjectKey={subjectKey}
        allowManage
      />

      <CommentsBoard
        scope="class"
        classKey={classKey}
        subjectKey={subjectKey}
      />

      <RequestNotesBoard
        scope="class"
        classKey={classKey}
        subjectKey={subjectKey}
      />
    </div>
  );
}
