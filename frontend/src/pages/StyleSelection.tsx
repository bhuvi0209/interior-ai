import { useState } from "react";

function StyleSelection() {
  const [selectedStyle, setSelectedStyle] = useState("");

  return (
    <div>
      <h1>Select Your Style</h1>

      <button onClick={() => setSelectedStyle("Modern")}>
        Modern
      </button>

      <p>Selected style: {selectedStyle}</p>
    </div>
  );
}

export default StyleSelection;