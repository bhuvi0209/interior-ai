import { useState } from "react";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type TransformMode = "translate" | "rotate";

type CameraView = "perspective" | "top" | "front";

export default function ThreeDView() {
  const { project, setProject } = useProject();

  const [selectedId, setSelectedId] = useState<
    string | number | null
  >(null);

  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const [cameraView, setCameraView] =
    useState<CameraView>("perspective");

  const handleTransformEnd = (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => {
    console.log("THREEDVIEW RECEIVED:", {
      id,
      x,
      y,
      rotation,
    });

    setProject((currentProject) => {
      const updatedFurniture =
        currentProject.furniture.map((item) => {
          if (item.id !== id) {
            return item;
          }

          return {
            ...item,
            x,
            y,
            rotation,
          };
        });

      const updatedProject = {
        ...currentProject,
        furniture: updatedFurniture,
      };

      const updatedItem = updatedFurniture.find(
        (item) => item.id === id
      );

      console.log(
        "THREEDVIEW UPDATED ITEM:",
        updatedItem
      );

      console.log(
        "THREEDVIEW UPDATED PROJECT:",
        updatedProject
      );

      return updatedProject;
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#f4f4f4",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          minHeight: "60px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          boxSizing: "border-box",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {/* PROJECT NAME */}
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

        {/* CONTROLS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* MOVE */}
          <button
            type="button"
            onClick={() => setTransformMode("translate")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                transformMode === "translate"
                  ? "#2563eb"
                  : "#fff",
              color:
                transformMode === "translate"
                  ? "#fff"
                  : "#333",
            }}
          >
            Move
          </button>

          {/* ROTATE */}
          <button
            type="button"
            onClick={() => setTransformMode("rotate")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                transformMode === "rotate"
                  ? "#2563eb"
                  : "#fff",
              color:
                transformMode === "rotate"
                  ? "#fff"
                  : "#333",
            }}
          >
            Rotate
          </button>

          {/* DESELECT */}
          <button
            type="button"
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

          {/* SEPARATOR */}
          <div
            style={{
              width: "1px",
              height: "30px",
              background: "#ddd",
              margin: "0 4px",
            }}
          />

          {/* CAMERA LABEL */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#555",
            }}
          >
            Camera:
          </span>

          {/* PERSPECTIVE */}
          <button
            type="button"
            onClick={() => setCameraView("perspective")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                cameraView === "perspective"
                  ? "#2563eb"
                  : "#fff",
              color:
                cameraView === "perspective"
                  ? "#fff"
                  : "#333",
            }}
          >
            Perspective
          </button>

          {/* TOP */}
          <button
            type="button"
            onClick={() => setCameraView("top")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                cameraView === "top"
                  ? "#2563eb"
                  : "#fff",
              color:
                cameraView === "top"
                  ? "#fff"
                  : "#333",
            }}
          >
            Top
          </button>

          {/* FRONT */}
          <button
            type="button"
            onClick={() => setCameraView("front")}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background:
                cameraView === "front"
                  ? "#2563eb"
                  : "#fff",
              color:
                cameraView === "front"
                  ? "#fff"
                  : "#333",
            }}
          >
            Front
          </button>
        </div>
      </div>

      {/* 3D SCENE */}
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
          cameraView={cameraView}
          onSelect={setSelectedId}
          onClearSelection={() => setSelectedId(null)}
          onTransformEnd={handleTransformEnd}
        />
      </div>
    </div>
  );
}