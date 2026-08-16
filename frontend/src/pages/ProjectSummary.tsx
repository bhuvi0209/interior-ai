import { useProject } from "../context/ProjectContext";

function ProjectSummary() {
  const { project } = useProject();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Project Summary</h1>

      <h2>Room Image</h2>

      {project.roomImage ? (
        <img
          src={project.roomImage}
          alt="Uploaded room"
          style={{
            width: "600px",
            maxWidth: "100%",
            borderRadius: "10px",
          }}
        />
      ) : (
        <p>No image uploaded.</p>
      )}

      <h2>Style</h2>

      <p>
        {project.style || "No style selected"}
      </p>

      <h2>Furniture</h2>

      <p>
        {project.furniture.length === 0
          ? "No furniture added."
          : `${project.furniture.length} furniture item(s)`}
      </p>

      <h2>Debug Project Data</h2>

      <pre
        style={{
          background: "#f5f5f5",
          padding: "20px",
          overflow: "auto",
        }}
      >
        {JSON.stringify(project, null, 2)}
      </pre>
    </div>
  );
}

export default ProjectSummary;