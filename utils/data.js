import { catalog } from "./catalog";

export const courses = Object.fromEntries(
  Object.entries(catalog.courses).map(([courseKey, courseData]) => [
    courseKey,
    {
      name: courseData.label,
      semesters: Object.fromEntries(
        Object.entries(courseData.semesters).map(([semesterKey, semesterData]) => [
          semesterKey,
          {
            name: semesterData.label,
            subjects: semesterData.subjects.map((subject) => ({
              name: subject.label,
              pdfs: [],
            })),
          },
        ])
      ),
      subjects: [],
    },
  ])
);
