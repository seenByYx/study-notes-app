"use client";

import Link from "next/link";
import { courses } from "/utils/data";

export default function SemesterPage({ params }) {
  const { course: courseName, semester } = params;
  const courseData = courses[courseName];
  const semNumber = parseInt(semester.replace("sem", ""));
  
  // Mock data for subjects based on semester
  const subjects = courseData?.subjects?.slice(0, 3) || []; 

  return (
    <div className="content3">
      <h1>{courseName} - {semester}</h1>
      <p>Subjects available in this semester:</p>
      <ul>
        {subjects.map((subject, index) => (
          <li key={index}>
            <Link href={`/courses/${courseName}/${semester}/${subject.name.toLowerCase().replace(/ /g, "-")}`}>
              {subject.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
