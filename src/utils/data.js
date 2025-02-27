// src/utils/data.js
export const classes = {
    class11: {
      name: "Class 11",
      subjects: ["Physics", "Chemistry", "Maths", "Biology"],
      pdfs: [
        { name: "Physics Notes", file: "physics.pdf" },
        { name: "Chemistry Notes", file: "chemistry.pdf" },
      ],
    },
    class12: {
      name: "Class 12",
      streams: {
        bio: {
          name: "Biology",
          subjects: ["Physics", "Chemistry", "Biology"],
          pdfs: [
            { name: "Biology Notes", file: "biology.pdf" },
            { name: "Chemistry Notes", file: "chemistry.pdf" },
          ],
        },
        cs: {
          name: "Computer Science",
          subjects: ["Computer Science", "Maths"],
          pdfs: [
            { name: "CS Notes", file: "cs.pdf" },
            { name: "Maths Notes", file: "maths.pdf" },
          ],
        },
        commerce: {
          name: "Commerce",
          subjects: ["Accountancy", "Economics", "Business Studies"],
          pdfs: [
            { name: "Accountancy Notes", file: "accountancy.pdf" },
            { name: "Economics Notes", file: "economics.pdf" },
          ],
        },
        humanities: {
          name: "Humanities",
          subjects: ["History", "Political Science", "Geography"],
          pdfs: [
            { name: "History Notes", file: "history.pdf" },
            { name: "Geography Notes", file: "geography.pdf" },
          ],
        },
      },
    },
  };
  
  // src/utils/data.js
export const courses = {
  bscCs: {
    name: "BSc Computer Science",
    subjects: [
      {
        name: "Mathematics",
        pdfs: [
          { name: "Sameeha Miss 1", file: "Sameeh’s 1.pdf" },
          { name: "Infas sir", file: "Infas Sir.pdf" },
          { name: "Amal Miss", file: "Amal Miss.pdf" },
        ],
      },
      {
        name: "Microprocessors",
        pdfs: [
          { name: "Introduction to Data Structures", file: "ds-intro.pdf" },
          { name: "Linked Lists", file: "linked-lists.pdf" },
          { name: "SEM 4 MP Micro bit 1", file: "Microprocessor micro sem 3.pdf" },
        ],
      },
      {
        name: "RDBMS",
        pdfs: [
          { name: "Sorting Algorithms", file: "sorting-algos.pdf" },
          { name: "Dynamic Programming", file: "dp.pdf" },
        ],
      },
    ],
  },
  bca: {
    name: "BCA",
    subjects: [
      {
        name: "Web Development",
        pdfs: [
          { name: "HTML Basics", file: "html-basics.pdf" },
          { name: "CSS Flexbox", file: "css-flexbox.pdf" },
        ],
      },
      {
        name: "Networking",
        pdfs: [
          { name: "OSI Model", file: "osi-model.pdf" },
          { name: "TCP/IP", file: "tcp-ip.pdf" },
        ],
      },
    ],
  },
  economics: {
    name: "Economics",
    subjects: [
      {
        name: "Microeconomics",
        pdfs: [
          { name: "Supply and Demand", file: "supply-demand.pdf" },
          { name: "Elasticity", file: "elasticity.pdf" },
        ],
      },
      {
        name: "Macroeconomics",
        pdfs: [
          { name: "GDP", file: "gdp.pdf" },
          { name: "Inflation", file: "inflation.pdf" },
        ],
      },
    ],
  },
};