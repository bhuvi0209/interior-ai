import { useState } from "react";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type TransformMode = "translate" | "rotate";

export default function ThreeDView() {
  const { project, setProject } = useProject();

  const [selectedId, setSelectedId] = useState<string | number | null>(
    null
  );

  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const handleTransformEnd = (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture: currentProject.furniture.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          x,
          y,
          rotation,
        };
      }),
    }));
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "60px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            {project.name || "Untitled Project"}
          </h2>

          <span
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            3D Room View
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            onClick={() => setTransformMode("translate")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                transformMode === "translate" ? "#2563eb" : "#fff",
              color:
                transformMode === "translate" ? "#fff" : "#333",
            }}
          >
            Move
          </button>

          <button
            onClick={() => setTransformMode("rotate")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                transformMode === "rotate" ? "#2563eb" : "#fff",
              color:
                transformMode === "rotate" ? "#fff" : "#333",
            }}
          >
            Rotate
          </button>

          <button
            onClick={() => setSelectedId(null)}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "#fff",
              color: "#333",
            }}
          >
            Deselect
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <RoomScene
          furniture={project.furniture}
          selectedId={selectedId}
          transformMode={transformMode}
          onSelect={setSelectedId}
          onTransformEnd={handleTransformEnd}
        />
      </div>
    </div>
  );
}