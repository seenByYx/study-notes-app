"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import NotesBoard from "../../components/NotesBoard";
import { catalog } from "../../../utils/catalog";

export default function UploadPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManage = role === "admin" || role === "owner";

  const [scope, setScope] = useState("class");
  const [classKey, setClassKey] = useState("");
  const [courseKey, setCourseKey] = useState("");
  const [semesterKey, setSemesterKey] = useState("");
  const [subjectKey, setSubjectKey] = useState("");

  const classOptions = useMemo(
    () => Object.entries(catalog.classes).map(([key, item]) => ({ key, label: item.label })),
    []
  );

  const courseOptions = useMemo(
    () => Object.entries(catalog.courses).map(([key, item]) => ({ key, label: item.label })),
    []
  );

  const semesterOptions = useMemo(() => {
    if (!courseKey) return [];
    const semesters = catalog.courses[courseKey]?.semesters || {};
    return Object.entries(semesters).map(([key, item]) => ({ key, label: item.label }));
  }, [courseKey]);

  const subjectOptions = useMemo(() => {
    if (scope === "class") {
      if (!classKey) return [];
      return catalog.classes[classKey]?.subjects || [];
    }
    if (!courseKey || !semesterKey) return [];
    return catalog.courses[courseKey]?.semesters?.[semesterKey]?.subjects || [];
  }, [scope, classKey, courseKey, semesterKey]);

  const canOpenBoard =
    scope === "class"
      ? Boolean(classKey && subjectKey)
      : Boolean(courseKey && semesterKey && subjectKey);

  const selectedTitle = useMemo(() => {
    if (!canOpenBoard) return "Upload Notes";
    if (scope === "class") {
      const classLabel = catalog.classes[classKey]?.label || classKey;
      const subjectLabel = subjectOptions.find((item) => item.key === subjectKey)?.label || subjectKey;
      return `${classLabel} / ${subjectLabel}`;
    }
    const courseLabel = catalog.courses[courseKey]?.label || courseKey;
    const semesterLabel = catalog.courses[courseKey]?.semesters?.[semesterKey]?.label || semesterKey;
    const subjectLabel = subjectOptions.find((item) => item.key === subjectKey)?.label || subjectKey;
    return `${courseLabel} / ${semesterLabel} / ${subjectLabel}`;
  }, [canOpenBoard, scope, classKey, courseKey, semesterKey, subjectKey, subjectOptions]);

  const onScopeChange = (event) => {
    const nextScope = event.target.value;
    setScope(nextScope);
    setClassKey("");
    setCourseKey("");
    setSemesterKey("");
    setSubjectKey("");
  };

  if (!canManage) {
    return <p className="error-text">Only admin or owner can access uploads.</p>;
  }

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Upload Notes</h1>
        <p>Select scope, class/course, semester, and subject. Upload everything from one place.</p>
      </section>

      <section className="card">
        <h3>Choose Destination</h3>
        <div className="upload-grid">
          <select value={scope} onChange={onScopeChange}>
            <option value="class">Class</option>
            <option value="course">Course</option>
          </select>

          {scope === "class" && (
            <>
              <select
                value={classKey}
                onChange={(event) => {
                  setClassKey(event.target.value);
                  setSubjectKey("");
                }}
              >
                <option value="">Select class</option>
                {classOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select value={subjectKey} onChange={(event) => setSubjectKey(event.target.value)} disabled={!classKey}>
                <option value="">Select subject</option>
                {subjectOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {scope === "course" && (
            <>
              <select
                value={courseKey}
                onChange={(event) => {
                  setCourseKey(event.target.value);
                  setSemesterKey("");
                  setSubjectKey("");
                }}
              >
                <option value="">Select course</option>
                {courseOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={semesterKey}
                onChange={(event) => {
                  setSemesterKey(event.target.value);
                  setSubjectKey("");
                }}
                disabled={!courseKey}
              >
                <option value="">Select semester</option>
                {semesterOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={subjectKey}
                onChange={(event) => setSubjectKey(event.target.value)}
                disabled={!courseKey || !semesterKey}
              >
                <option value="">Select subject</option>
                {subjectOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        {scope === "course" && courseKey && semesterKey && subjectOptions.length === 0 && (
          <p className="muted">No subjects configured for this semester yet.</p>
        )}
      </section>

      {canOpenBoard ? (
        <NotesBoard
          title={selectedTitle}
          scope={scope}
          classKey={scope === "class" ? classKey : undefined}
          courseKey={scope === "course" ? courseKey : undefined}
          semesterKey={scope === "course" ? semesterKey : undefined}
          subjectKey={subjectKey}
          allowManage
        />
      ) : (
        <section className="card">
          <p className="muted">Complete selection above to manage notes.</p>
        </section>
      )}
    </div>
  );
}
