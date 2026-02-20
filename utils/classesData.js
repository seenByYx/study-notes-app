import { catalog } from "./catalog";

export const classes = Object.fromEntries(
  Object.entries(catalog.classes).map(([classKey, classData]) => [
    classKey,
    {
      name: classData.label,
      subjects: classData.subjects.map((subject) => ({
        name: subject.label,
        notes: { pdfs: [], images: [] },
        qPapers: { pdfs: [], images: [] },
      })),
    },
  ])
);
