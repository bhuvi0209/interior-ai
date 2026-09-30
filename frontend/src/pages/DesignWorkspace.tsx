import { useState } from "react";
import Editor from "./Editor";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type ViewMode = "2D" | "3D";
type TransformMode = "translate" | "rotate";
type CameraView = "perspective" | "top" | "front";

export default function DesignWorkspace() {
  const { project, setProject } = useProject();

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

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
    setProject((previousProject) => ({
      ...previousProject,
      furniture: previousProject.furniture.map((item) =>
        item.id === id
          ? {
              ...item,
              x,
              y,
              rotation,
            }
          : item
      ),
    }));
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f4f4f4",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: "#20242c",
          color: "white",
          flexWrap: "wrap",
        }}
      >
        <strong
          style={{
            marginRight: "auto",
            fontSize: "18px",
          }}
        >
          {project.name || "Untitled Project"}
        </strong>

        <button
          type="button"
          onClick={() => {
            setViewMode("2D");
            setSelectedId(null);
          }}
          style={{
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: viewMode === "2D" ? "bold" : "normal",
          }}
        >
          2D View
        </button>

        <button
          type="button"
          onClick={() => setViewMode("3D")}
          style={{
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: viewMode === "3D" ? "bold" : "normal",
          }}
        >
          3D View
        </button>
      </header>

      {/* 3D TOOLBAR */}
      {viewMode === "3D" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            padding: "10px 16px",
            background: "#ffffff",
            borderBottom: "1px solid #d6d6d6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <strong
            style={{
              marginRight: "8px",
              color: "#333",
            }}
          >
            3D Controls
          </strong>

          {/* TRANSFORM CONTROLS */}

          <button
            type="button"
            onClick={() => setTransformMode("translate")}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
              fontWeight:
                transformMode === "translate"
                  ? "bold"
                  : "normal",
            }}
          >
            Move
          </button>

          <button
            type="button"
            onClick={() => setTransformMode("rotate")}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
              fontWeight:
                transformMode === "rotate"
                  ? "bold"
                  : "normal",
            }}
          >
            Rotate
          </button>

          <button
            type="button"
            onClick={() => setSelectedId(null)}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
            }}
          >
            Deselect
          </button>

          {/* CAMERA CONTROLS */}

          <span
            style={{
              width: "1px",
              height: "28px",
              background: "#ccc",
              margin: "0 5px",
            }}
          />

          <strong
            style={{
              color: "#333",
            }}
          >
            Camera:
          </strong>

          <button
            type="button"
            onClick={() => setCameraView("perspective")}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
              fontWeight:
                cameraView === "perspective"
                  ? "bold"
                  : "normal",
            }}
          >
            Perspective
          </button>

          <button
            type="button"
            onClick={() => setCameraView("top")}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
              fontWeight:
                cameraView === "top"
                  ? "bold"
                  : "normal",
            }}
          >
            Top
          </button>

          <button
            type="button"
            onClick={() => setCameraView("front")}
            style={{
              padding: "7px 12px",
              cursor: "pointer",
              fontWeight:
                cameraView === "front"
                  ? "bold"
                  : "normal",
            }}
          >
            Front
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          minHeight: "600px",
          position: "relative",
        }}
      >
        {viewMode === "2D" ? (
          <Editor />
        ) : (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 110px)",
              minHeight: "600px",
              position: "relative",
            }}
          >
            <RoomScene
              furniture={project.furniture}
              selectedId={selectedId}
              transformMode={transformMode}
              cameraView={cameraView}
              onSelect={setSelectedId}
              onTransformEnd={handleTransformEnd}
            />
          </div>
        )}
      </main>
    </div>
  );
}