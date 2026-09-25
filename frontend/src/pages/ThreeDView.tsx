import {
  useProject,
} from "../context/ProjectContext";

import RoomScene from "../3d/RoomScene";

export default function ThreeDView() {
  const {
    project,
  } = useProject();

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#eeeeee",
      }}
    >
      {/* Header */}

      <div
        style={{
          height: "55px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: "#ffffff",
          borderBottom:
            "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          3D View
        </h2>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "13px",
            color: "#777",
          }}
        >
          {project.name}
        </div>
      </div>

      {/* 3D Scene */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
        }}
      >
        <RoomScene
          furniture={
            project.furniture
          }
        />
      </div>
    </div>
  );
}