"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { courses } from "/utils/data";

export default function SubjectPage() {
  const { course: courseName, semester, subject: subjectName } = useParams();
  
  const courseData = courses[courseName];
  const semesterData = courseData?.semesters[semester];
  const subjectData = semesterData?.subjects.find(
    (sub) => sub.name.toLowerCase().replace(/ /g, "-") === subjectName
  );

  const [pdfs, setPdfs] = useState(subjectData?.pdfs || []);

  useEffect(() => {
    setPdfs(subjectData?.pdfs || []);
  }, [subjectData?.pdfs]);

  // Group PDFs by category
  const categorizedPdfs = pdfs.reduce((acc, pdf) => {
    if (!acc[pdf.category]) acc[pdf.category] = [];
    acc[pdf.category].push(pdf);
    return acc;
  }, {});

  return (
    <div className="content4">
      <h1>{subjectData?.name} Notes</h1>
      {Object.entries(categorizedPdfs).map(([category, pdfList]) => (
        <div key={category}>
          <h2>{category}</h2>
          <ul>
            {pdfList.map((pdf, index) => (
              <li key={index}>
                <a href={`/pdfs/${pdf.file}`} target="_blank" rel="noopener noreferrer">
                  {pdf.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
