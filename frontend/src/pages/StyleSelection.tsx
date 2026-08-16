import { useState } from "react";
import { useProject } from "../context/ProjectContext";
const styles = [
  "Modern",
  "Minimalist",
  "Traditional",
  "Scandinavian",
  "Industrial",
  "Japandi",
];

function StyleSelection() {
  const { project, setProject } = useProject();
  const [selectedStyle, setSelectedStyle] = useState("");

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1>Choose Your Interior Style</h1>

      <p>
        Select a style for your room design.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => {
              setSelectedStyle(style);

              setProject((prev) => ({
                ...prev,
                style: style,
              }));
          }}

            style={{
              padding: "20px 30px",
              borderRadius: "10px",
              border:
                selectedStyle === style
                  ? "3px solid black"
                  : "1px solid #ccc",
              background:
                selectedStyle === style
                  ? "#eee"
                  : "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {style}
          </button>
        ))}
      </div>

      {selectedStyle && (
        <div style={{ marginTop: "30px" }}>
          <h2>Selected Style</h2>
          <p>{selectedStyle}</p>

          <button
            style={{
              padding: "12px 25px",
              marginTop: "10px",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

export default StyleSelection;