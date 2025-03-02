import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import styles from "./SearchBar.module.css";
import { courses } from "/utils/data"; 
import { classes } from "/utils/classesData";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setQuery(searchValue);

    console.log("🔍 Search Query:", searchValue);
    console.log("📚 Classes Data:", classes);
    console.log("🎓 Courses Data:", courses);

    if (!searchValue) {
      setResults([]);
      onSearch([]);
      return;
    }

    const allResults = [];

    // 🔹 Search in Classes (Class 11, Class 12)
    Object.keys(classes).forEach((classKey) => {
      const classData = classes[classKey];

      // ✅ Search Class Name (Class 11 / Class 12)
      if (classData.name.toLowerCase().includes(searchValue)) {
        console.log("✅ Matched Class:", classData.name);
        allResults.push({ type: "class", name: classData.name });
      }

      // ✅ Search Subjects inside Class
      classData.subjects.forEach((subject) => {
        if (subject.name.toLowerCase().includes(searchValue)) {
          console.log("✅ Matched Subject:", subject.name, "in", classData.name);
          allResults.push({ type: "subject", class: classData.name, name: subject.name });
        }

        // 🔸 Search PDFs & Images inside Notes
        subject.notes?.pdfs?.forEach((pdf) => {
          if (pdf.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "pdf", class: classData.name, subject: subject.name, name: pdf.name, file: pdf.file });
          }
        });

        subject.notes?.images?.forEach((img) => {
          if (img.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "image", class: classData.name, subject: subject.name, name: img.name, file: img.file });
          }
        });

        // 🔸 Search PDFs & Images inside Question Papers
        subject.qPapers?.pdfs?.forEach((pdf) => {
          if (pdf.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "qpaper", class: classData.name, subject: subject.name, name: pdf.name, file: pdf.file });
          }
        });

        subject.qPapers?.images?.forEach((img) => {
          if (img.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "qpaper-image", class: classData.name, subject: subject.name, name: img.name, file: img.file });
          }
        });
      });
    });

    // 🔹 Search in Courses (BSc CS, BCA, etc.)
    Object.keys(courses).forEach((courseKey) => {
      const courseData = courses[courseKey];

      // ✅ Search Course Name
      if (courseData.name.toLowerCase().includes(searchValue)) {
        console.log("✅ Matched Course:", courseData.name);
        allResults.push({ type: "course", name: courseData.name });
      }

      // ✅ Search Subjects inside Courses
      courseData.subjects.forEach((subject) => {
        if (subject.name.toLowerCase().includes(searchValue)) {
          console.log("✅ Matched Course Subject:", subject.name, "in", courseData.name);
          allResults.push({ type: "subject", course: courseData.name, name: subject.name });
        }

        // 🔸 Search PDFs & Images inside Notes
        subject.notes?.pdfs?.forEach((pdf) => {
          if (pdf.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "pdf", course: courseData.name, subject: subject.name, name: pdf.name, file: pdf.file });
          }
        });

        subject.notes?.images?.forEach((img) => {
          if (img.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "image", course: courseData.name, subject: subject.name, name: img.name, file: img.file });
          }
        });

        // 🔸 Search PDFs & Images inside Question Papers
        subject.qPapers?.pdfs?.forEach((pdf) => {
          if (pdf.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "qpaper", course: courseData.name, subject: subject.name, name: pdf.name, file: pdf.file });
          }
        });

        subject.qPapers?.images?.forEach((img) => {
          if (img.name.toLowerCase().includes(searchValue)) {
            allResults.push({ type: "qpaper-image", course: courseData.name, subject: subject.name, name: img.name, file: img.file });
          }
        });
      });
    });

    console.log("📌 Final Search Results:", allResults);

    setResults(allResults);
    onSearch(allResults); // Optionally pass results to parent
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for subjects, PDFs, images..."
        className={styles.searchInput}
      />
      <FaSearch className={styles.searchIcon} />

      {/* Display Results */}
      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          {results.map((result, index) => (
            <div key={index} className={styles.resultItem}>
              {result.type === "class" && <p>📚 {result.name}</p>}
              {result.type === "course" && <p>🎓 {result.name}</p>}
              {result.type === "subject" && (
                <p>📖 <strong>{result.class || result.course}</strong>: {result.name}</p>
              )}
              {result.type === "pdf" && (
                <p>📄 <strong>{result.class || result.course} - {result.subject}:</strong> {result.name}</p>
              )}
              {result.type === "image" && (
                <p>🖼️ <strong>{result.class || result.course} - {result.subject}:</strong> {result.name}</p>
              )}
              {result.type === "qpaper" && (
                <p>📑 <strong>{result.class || result.course} - {result.subject}:</strong> {result.name}</p>
              )}
              {result.type === "qpaper-image" && (
                <p>📝 <strong>{result.class || result.course} - {result.subject}:</strong> {result.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
