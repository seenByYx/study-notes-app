"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { courses } from "/utils/data";  

export default function CoursePage({ params }) {
  const [courseName, setCourseName] = useState("");       
  const [courseData, setCourseData] = useState(null);     
  const [expandedSem, setExpandedSem] = useState(null);    

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setCourseName(resolvedParams.course);
      setCourseData(courses[resolvedParams.course]);
    };
    unwrapParams();
  }, [params]);

  // Function to toggle semester
  const toggleSemester = (sem) => {
    setExpandedSem(expandedSem === sem ? null : sem);
  };

  if (!courseData) {
    return <div>Course not found!</div>;
  }

  return (
    <div className="content2">
      <h1>{courseData.name} Study Notes</h1>
      <p>Select a semester to view subjects:</p>

      {Object.entries(courseData.semesters).map(([semKey, semData]) => (
        <div key={semKey} className="semester-container">
          <div
            className="semester-header"
            onClick={() => toggleSemester(semKey)}
          >
            <span>{semData.name}</span>
            <span className="arrow">{expandedSem === semKey ? "▲" : "▼"}</span>
          </div>

          {/* Render subjects if this semester is expanded */}
          {expandedSem === semKey && (
            <div className="subjects-list">
              <ul>
                {semData.subjects.map((subject, index) => (
                  <li key={index}>
                    <Link
                      href={`/courses/${courseName}/${semKey}/${subject.name
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                    >
                      {subject.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
