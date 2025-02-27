"use client";

import React, { useState, useEffect } from "react";
import { courses } from "../../../../utils/data";

export default function SubjectPage({ params }) {
  const { course: courseName, subject: subjectName } = params;

  // Find the course and subject
  const courseData = courses[courseName];
  const subjectData = courseData.subjects.find(
    (sub) => sub.name.toLowerCase().replace(/ /g, "-") === subjectName
  );

  // State to track PDFs and new PDF alert
  const [pdfs, setPdfs] = useState(subjectData.pdfs);

  useEffect(() => {
    setPdfs(subjectData.pdfs);
  }, [subjectData.pdfs]);

  return (
    <div className="content3">
      <h1>{subjectData.name} Notes</h1>
      <p>PDFs for this subject:</p>

      <ul>
        {pdfs.map((pdf, index) => (
          <li key={index}>
            <a href={`/pdfs/${pdf.file}`} target="_blank" rel="noopener noreferrer">
              {pdf.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
