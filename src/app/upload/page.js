"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import NotesBoard from "../../components/NotesBoard";
import { catalog } from "../../../utils/catalog";

function toSubjectKey(label) {
  return String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function UploadPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManage = role === "admin" || role === "owner";

  const [scope, setScope] = useState("class");
  const [classKey, setClassKey] = useState("");
  const [courseKey, setCourseKey] = useState("");
  const [semesterKey, setSemesterKey] = useState("");
  const [subjectKey, setSubjectKey] = useState("");
  const [customSubjects, setCustomSubjects] = useState([]);
  const [subjectMessage, setSubjectMessage] = useState("");

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
    const map = new Map();
    const add = (item) => {
      if (!item?.key) return;
      if (!map.has(item.key)) map.set(item.key, item);
    };

    if (scope === "class") {
      if (!classKey) return [];
      (catalog.classes[classKey]?.subjects || []).forEach(add);
      customSubjects.forEach(add);
      return Array.from(map.values());
    }
    if (!courseKey || !semesterKey) return [];
    (catalog.courses[courseKey]?.semesters?.[semesterKey]?.subjects || []).forEach(add);
    customSubjects.forEach(add);
    return Array.from(map.values());
  }, [scope, classKey, courseKey, semesterKey, customSubjects]);

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

  const loadCustomSubjects = useCallback(async () => {
    setCustomSubjects([]);
    setSubjectMessage("");
    try {
      const params = new URLSearchParams({ scope });
      if (scope === "class") {
        if (!classKey) return;
        params.set("classKey", classKey);
      } else {
        if (!courseKey || !semesterKey) return;
        params.set("courseKey", courseKey);
        params.set("semesterKey", semesterKey);
      }
      const res = await fetch(`/api/subjects?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load subjects");
      setCustomSubjects(data.subjects || []);
    } catch (error) {
      setSubjectMessage(error.message);
    }
  }, [scope, classKey, courseKey, semesterKey]);

  const addSubject = async () => {
    setSubjectMessage("");
    const label = window.prompt("Enter subject name");
    if (!label) return;
    const key = toSubjectKey(label);
    if (!key) {
      setSubjectMessage("Invalid subject name.");
      return;
    }

    try {
      const payload =
        scope === "class"
          ? { scope, classKey, key, label: label.trim() }
          : { scope, courseKey, semesterKey, key, label: label.trim() };
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add subject");
      setSubjectMessage("Subject added.");
      await loadCustomSubjects();
      setSubjectKey(key);
    } catch (error) {
      setSubjectMessage(error.message);
    }
  };

  // Load custom subjects when destination changes.
  useEffect(() => {
    loadCustomSubjects();
  }, [loadCustomSubjects]);

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
          <div className="row-between" style={{ marginTop: 10 }}>
            <p className="muted" style={{ margin: 0 }}>No subjects configured for this semester yet.</p>
            <button type="button" className="secondary-button" onClick={addSubject}>
              + Add Subject
            </button>
          </div>
        )}
        {scope === "class" && classKey && subjectOptions.length === 0 && (
          <div className="row-between" style={{ marginTop: 10 }}>
            <p className="muted" style={{ margin: 0 }}>No subjects configured for this class yet.</p>
            <button type="button" className="secondary-button" onClick={addSubject}>
              + Add Subject
            </button>
          </div>
        )}
        {subjectMessage && <p className="muted" style={{ marginTop: 8 }}>{subjectMessage}</p>}
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
