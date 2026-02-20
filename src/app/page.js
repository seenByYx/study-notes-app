"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { catalog } from "../../utils/catalog";
import OwnerPanel from "../components/OwnerPanel";

function getSearchItems() {
  const items = [];

  Object.entries(catalog.classes).forEach(([classKey, classData]) => {
    classData.subjects.forEach((subject) => {
      items.push({
        label: `${classData.label} - ${subject.label}`,
        href: `/classes/${classKey}/${subject.key}`,
      });
    });
  });

  Object.entries(catalog.courses).forEach(([courseKey, courseData]) => {
    Object.entries(courseData.semesters).forEach(([semesterKey, semesterData]) => {
      semesterData.subjects.forEach((subject) => {
        items.push({
          label: `${courseData.label} - ${semesterData.label} - ${subject.label}`,
          href: `/courses/${courseKey}/${semesterKey}/${subject.key}`,
        });
      });
    });
  });

  return items;
}

export default function HomePage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "owner";
  const [query, setQuery] = useState("");
  const allItems = useMemo(() => getSearchItems(), []);
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, allItems]);

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Study Notes</h1>
        <p>Browse by class or course and open subjects directly.</p>
      </section>

      <section className="card">
        <h3>Quick Search</h3>
        <input
          type="text"
          placeholder="Search subjects..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <ul className="sub-list" style={{ marginTop: 12 }}>
            {results.length === 0 && <li className="muted">No matches found.</li>}
            {results.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid">
        {Object.entries(catalog.classes).map(([classKey, classData]) => (
          <article className="card" key={classKey}>
            <h3>{classData.label}</h3>
            <ul className="sub-list">
              {classData.subjects.map((subject) => (
                <li key={subject.key}>
                  <Link href={`/classes/${classKey}/${subject.key}`}>{subject.label}</Link>
                </li>
              ))}
            </ul>
          </article>
        ))}

        {Object.entries(catalog.courses).map(([courseKey, courseData]) => (
          <article className="card" key={courseKey}>
            <h3>{courseData.label}</h3>
            <ul className="sub-list">
              <li>
                <Link href={`/courses/${courseKey}`}>Open course</Link>
              </li>
            </ul>
          </article>
        ))}
      </section>

      {isOwner && <OwnerPanel />}
    </div>
  );
}
