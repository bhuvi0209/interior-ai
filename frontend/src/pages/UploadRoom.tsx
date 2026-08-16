import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProject } from "../context/ProjectContext";

function UploadRoom() {
  const [preview, setPreview] = useState("");

  const { setProject } = useProject();

  const navigate = useNavigate();

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      setPreview(imageData);

      setProject((currentProject) => ({
        ...currentProject,
        roomImage: imageData,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (!preview) {
      alert("Please select a room image first.");
      return;
    }

    navigate("/style");
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <h1>Upload Your Room</h1>

      <p>
        Select an image of the room you want to
        redesign.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {preview && (
        <div style={{ marginTop: "30px" }}>
          <h2>Room Preview</h2>

          <img
            src={preview}
            alt="Uploaded room"
            style={{
              width: "600px",
              maxWidth: "100%",
              borderRadius: "10px",
            }}
          />
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!preview}
        style={{
          marginTop: "25px",
          padding: "12px 25px",
          fontSize: "16px",
        }}
      >
        Continue
      </button>
    </div>
  );
}

export default UploadRoom;