
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { setProject } = useProject();
  const navigate = useNavigate();

  const [selectedStyle, setSelectedStyle] = useState("");

  const handleContinue = () => {
    if (!selectedStyle) {
      return;
    }

    // Save the selected style in ProjectContext
    setProject((prev) => ({
      ...prev,
      style: selectedStyle,
    }));

    // Navigate to the furniture window
    navigate("/furniture");
  };

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1>Choose Your Interior Style</h1>

      <p>Select a style for your room design.</p>

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
            type="button"
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
            type="button"
            onClick={handleContinue}
            style={{
              padding: "12px 25px",
              marginTop: "10px",
              cursor: "pointer",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
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
