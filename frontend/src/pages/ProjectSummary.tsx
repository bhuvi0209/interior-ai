import { useProject } from "../context/ProjectContext";

function ProjectSummary() {
  const { project } = useProject();
function ProjectSummary() {
  const { project } = useProject();

  console.log("PROJECT DATA:", project);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Project Summary</h1>

      {/* the rest of your code */}
    </div>
  );
}
  return (
    <div style={{ padding: "40px" }}>
      <h1>Project Summary</h1>

      <h2>Room</h2>

      {project.roomImage ? (
        <img
          src={project.roomImage}
          alt="Room"
          style={{
            width: "400px",
            maxWidth: "100%",
          }}
        />
      ) : (
        <p>No room image selected.</p>
      )}

      <h2>Style</h2>

      <p>
        {project.style || "No style selected"}
      </p>

      <h2>Furniture</h2>

      {project.furniture.length === 0 ? (
        <p>No furniture added.</p>
      ) : (
        project.furniture.map((item) => (
          <p key={item.id}>
            {item.name} — X: {item.x}, Y: {item.y}
          </p>
        ))
      )}
    </div>
  );
}

export default ProjectSummary;