"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [filter, setFilter] = useState("recent");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const allItems = useMemo(() => getSearchItems(), []);

  useEffect(() => {
    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim(), filter, limit: "15" });
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed search");
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    run();
  }, [query, filter]);

  return (
    <div className="page-stack">
      <section className="hero">
        <h1>Study Notes</h1>
        <p>Browse by class or course and open subjects directly.</p>
      </section>

      <section className="card">
        <h3>Quick Search</h3>
        <div className="upload-grid">
        <input
          type="text"
          placeholder="Search notes/comments..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="recent">Recent</option>
            <option value="most_opened">Most opened</option>
            <option value="top_rated">Top rated</option>
          </select>
        </div>
        {query && (
          <ul className="sub-list" style={{ marginTop: 12 }}>
            {searchLoading && <li className="muted">Searching...</li>}
            {results.length === 0 && <li className="muted">No matches found.</li>}
            {results.map((item) => (
              <li key={`${item.href}-${item.title}`}>
                <Link href={item.href}>{item.title || item.label}</Link>
                {item.subtitle && <div className="muted" style={{ fontSize: "0.82rem" }}>{item.subtitle}</div>}
              </li>
            ))}
          </ul>
        )}
        {!query && (
          <ul className="sub-list" style={{ marginTop: 12 }}>
            {allItems.slice(0, 8).map((item) => (
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
