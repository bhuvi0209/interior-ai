import { useState } from "react";
import api from "../services/api";

function UploadRoom() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    const imageUrl = URL.createObjectURL(selectedFile);
    setPreview(imageUrl);

    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a room image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/upload-room",
        formData
      );

      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage("Upload failed.");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Upload Your Room</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {preview && (
        <div style={{ marginTop: "20px" }}>
          <h2>Preview</h2>

          <img
            src={preview}
            alt="Room preview"
            style={{
              width: "500px",
              maxWidth: "100%",
            }}
          />
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleUpload}>
          Upload Room
        </button>
      </div>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default UploadRoom;