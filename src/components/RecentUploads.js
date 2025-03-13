import React, { useState, useEffect } from "react";
import styles from "./RecentUploads.module.css";

const RecentUploads = () => {
  const [uploads, setUploads] = useState([]);

  // Fetch recent uploads (Replace with actual API call later)
  useEffect(() => {
    const fetchUploads = async () => {
      // Simulated data (Replace with API call)
      const data = [
        { name: "class 12 chemistry full chapter notes", url: "https://study-notes-rho.vercel.app/classes/class12/chemistry" },
        { name: "class 12 maths full chapters", url: "https://study-notes-rho.vercel.app/classes/class12/maths" },
      ];
      setUploads(data);
    };

    fetchUploads();
  }, []);

  return (
    <div className={styles.recentUploads}>
      <h2>📄 Recent Uploads</h2>
      <ul>
        {uploads.map((file, index) => (
          <li key={index}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentUploads;
