"use client"; // ✅ Keep this here

import { useState } from "react";
import Link from "next/link";
import RecentUploads from "../components/RecentUploads";

const courses = [
  { name: "Biology", path: "/classes/class11/bio" },
  { name: "Computer Science", path: "/classes/class11/cs" },
  { name: "Commerce", path: "/classes/class11/commerce" },
  { name: "Humanities", path: "/classes/class11/humanities" },

  { name: "Computer Science", path: "/classes/class12/cs" },
  { name: "Physics", path: "/classes/class12/physics" },
  { name: "Commerce", path: "/classes/class12/commerce" },
  { name: "Humanities", path: "/classes/class12/humanities" },
  { name: "BSc Computer Science", path: "/courses/bscCs" },
  { name: "BCA", path: "/courses/bca" },
  { name: "Economics", path: "/courses/economics" }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">

      <div className="content1">
        <p>
          Your one-stop destination for study notes and micro-bits PDFs. Explore
          our vast collection of free Micro Bit PDFs and handwritten notes for
          11th, 12th Calicut university students. It's perfect for beginners.
          Download now and start!
        </p>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery && (
          <div className="search-results">
            <h3>Search Results:</h3>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, index) => (
                <div key={index}>
                  <Link href={course.path}>{course.name}</Link>
                </div>
              ))
            ) : (
              <p>No results found for "{searchQuery}"</p>
            )}
            
          </div>
        )}

        <div className="classes">
       {/*<RecentUploads />*/}
          <div className="class-group">
            <h3>Class 11</h3>
            <div className="scroll-box">
              <Link href="/classes/class11/bio">Biology</Link>
              <Link href="/classes/class11/cs">Computer Science</Link>
              <Link href="/classes/class11/physics">Physics</Link>
              <Link href="/classes/class11/maths">Mathematics</Link>
              <Link href="/classes/class11/commerce">Commerce</Link>
              <Link href="/classes/class11/humanities">Humanities</Link>
            </div>
          </div>

          <div className="class-group">
            <h3>Class 12</h3>
            <div className="scroll-box">
             <Link href="/classes/class12/bio">Biology</Link>
              <Link href="/classes/class12/cs">Computer Science</Link>
              <Link href="/classes/class12/physics">Physics</Link>
              <Link href="/classes/class12/chemistry">Chemistry</Link>
              <Link href="/classes/class12/maths">Mathematics</Link>
              <Link href="/classes/class12/commerce">Commerce</Link>
              <Link href="/classes/class12/humanities">Humanities</Link>
              
            </div>
          </div>

          <div className="class-group">
            <h3>UG Courses</h3>
            <div className="scroll-box">
              <Link href="/courses/bscCs">BSc Computer Science</Link>
              <Link href="/courses/bca">BCA</Link>
              <Link href="/courses/economics">Economics</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
