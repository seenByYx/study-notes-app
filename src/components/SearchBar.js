import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import styles from './SearchBar.module.css';
import { classes, courses } from '../utils/data';  // Adjust path accordingly

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (event) => {
    const searchValue = event.target.value;
    setQuery(searchValue);

    // Handle search logic across all classes and courses
    const allResults = [];

    // Search through classes (e.g., class11, class12)
    for (const classKey in classes) {
      const classData = classes[classKey];
      if (classData.name.toLowerCase().includes(searchValue.toLowerCase())) {
        allResults.push({ type: 'class', name: classData.name });
      }

      classData.subjects.forEach((subject) => {
        if (subject.toLowerCase().includes(searchValue.toLowerCase())) {
          allResults.push({ type: 'subject', class: classData.name, name: subject });
        }
      });

      classData.pdfs.forEach((pdf) => {
        if (pdf.name.toLowerCase().includes(searchValue.toLowerCase())) {
          allResults.push({ type: 'pdf', class: classData.name, pdf: pdf });
        }
      });
    }

    // Search through courses (e.g., bscCs, bca)
    for (const courseKey in courses) {
      const courseData = courses[courseKey];
      if (courseData.name.toLowerCase().includes(searchValue.toLowerCase())) {
        allResults.push({ type: 'course', name: courseData.name });
      }

      courseData.subjects.forEach((subject) => {
        if (subject.name.toLowerCase().includes(searchValue.toLowerCase())) {
          allResults.push({ type: 'subject', course: courseData.name, name: subject.name });
        }

        subject.pdfs.forEach((pdf) => {
          if (pdf.name.toLowerCase().includes(searchValue.toLowerCase())) {
            allResults.push({ type: 'pdf', course: courseData.name, subject: subject.name, pdf: pdf });
          }
        });
      });
    }

    setResults(allResults);
    onSearch(allResults); // Optionally pass results to parent
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search"
        className={styles.searchInput}
      />
      <FaSearch className={styles.searchIcon} />

      {/* Display results */}
      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          {results.map((result, index) => (
            <div key={index} className={styles.resultItem}>
              {result.type === 'class' && <p>{result.name}</p>}
              {result.type === 'course' && <p>{result.name}</p>}
              {result.type === 'subject' && (
                <p>
                  <strong>{result.class || result.course}</strong>: {result.name}
                </p>
              )}
              {result.type === 'pdf' && (
                <p>
                  <strong>{result.class || result.course} - {result.subject}:</strong> {result.pdf.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
