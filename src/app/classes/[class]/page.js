export default function ClassPage({ params }) {
    const { class: className } = params;
  
    return (
      <div>
        <h1>Study Notes for {className}</h1>
      </div>
    );
  }