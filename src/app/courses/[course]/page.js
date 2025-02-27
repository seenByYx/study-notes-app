import Link from "next/link";
import { courses } from "../../../utils/data";

export default async function CoursePage({ params }) {
  const { course: courseName } = params; // This ensures params are available
  const courseData = courses[courseName];

  if (!courseData) {
    return <h1>Course Not Found</h1>;
  }

  return (
    <div className="content2">
      <h1>{courseData.name} Study Notes</h1>
      <p>Select a subject to view notes:</p>

      <ul>
        {courseData.subjects.map((subject, index) => (
          <li key={index}>
            <Link href={`/courses/${courseName}/${subject.name.toLowerCase().replace(/ /g, "-")}`}>
              {subject.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
