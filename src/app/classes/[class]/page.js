"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation"; // ✅ Import useParams
import { classes } from "/utils/classesData"; // ✅ Import classes

export default function ClassPage() {
  const params = useParams();
  const classKey = params.class?.toLowerCase(); // ✅ Ensure lowercase matching

  console.log("Class Param:", classKey); // 🔥 Debugging
  console.log("Available classes:", Object.keys(classes)); // 🔥 Debugging

  const classData = classes[classKey];

  if (!classData) {
    return <div>⚠️ Class not found!</div>;
  }

  return (
    <div>
      <h1>Study Notes for {classData.name}</h1>
      <ul>
        {classData.subjects.map((subject, index) => (
          <li key={index}>
            <Link
              href={`/classes/${classKey}/${subject.name
                .toLowerCase()
                .replace(/ /g, "-")}`}
            >
              {subject.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
