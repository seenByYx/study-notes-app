"use client";

import React from "react";
import { useParams } from "next/navigation";
import { classes } from "/utils/classesData";

export default function SubjectPage() {
  const params = useParams();
  const classKey = params.class?.toLowerCase();
  const subjectKey = params.subject?.replace(/-/g, " ").toLowerCase();

  console.log("Class Param:", classKey);
  console.log("Subject Param:", subjectKey);

  const classData = classes[classKey];

  if (!classData) {
    return <div>⚠️ Class not found!</div>;
  }

  const subjectData = classData.subjects.find(
    (sub) => sub.name.toLowerCase() === subjectKey
  );

  if (!subjectData) {
    return <div>⚠️ Subject not found!</div>;
  }

  return (
    <div className="content4">
      <h1>{subjectData.name} Notes</h1>

      {/* Notes Section */}
      {(subjectData.notes?.pdfs?.length > 0 || subjectData.notes?.images?.length > 0) && (
        <div>
          <h2>📚 Notes:</h2>
          <ul>
            {subjectData.notes?.pdfs?.map((pdf, index) => (
              <li key={index}>
                <a href={`/pdfs/${pdf.file}`} target="_blank" rel="noopener noreferrer">
                  {pdf.name}
                </a>
              </li>
            ))}
          </ul>
          {subjectData.notes?.images?.map((img, index) => (
            <div key={index} style={{ marginBottom: "15px" }}>
              <p>{img.name}</p>
              <img
                src={`/images/${img.file}`}
                alt={img.name}
                style={{ maxWidth: "100%", height: "auto", border: "1px solid #ddd", padding: "5px" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Question Papers Section */}
      {(subjectData.qPapers?.pdfs?.length > 0 || subjectData.qPapers?.images?.length > 0) && (
        <div>
          <h2>📄 Question Papers:</h2>
          <ul>
            {subjectData.qPapers?.pdfs?.map((pdf, index) => (
              <li key={index}>
                <a href={`/pdfs/${pdf.file}`} target="_blank" rel="noopener noreferrer">
                  {pdf.name}
                </a>
              </li>
            ))}
          </ul>
          {subjectData.qPapers?.images?.map((img, index) => (
            <div key={index} style={{ marginBottom: "15px" }}>
              <p>{img.name}</p>
              <img
                src={`/images/${img.file}`}
                alt={img.name}
                style={{ maxWidth: "100%", height: "auto", border: "1px solid #ddd", padding: "5px" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
