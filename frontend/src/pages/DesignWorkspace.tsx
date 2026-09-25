import { useState, Suspense } from "react";

import Editor from "./Editor";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type ViewMode = "2D" | "3D";

export default function DesignWorkspace() {
  const [viewMode, setViewMode] =
    useState<ViewMode>("2D");

  const { project } = useProject();

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#f5f5f5",
      }}
    >
      {/* View Switcher Toolbar */}

      <div
        style={{
          height: "56px",
          minHeight: "56px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 20px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Interior AI
        </h2>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            onClick={() => setViewMode("2D")}
            style={{
              padding: "9px 18px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              background:
                viewMode === "2D"
                  ? "#2563eb"
                  : "#ffffff",
              color:
                viewMode === "2D"
                  ? "#ffffff"
                  : "#333333",
              fontWeight: 600,
            }}
          >
            2D Editor
          </button>

          <button
            onClick={() => setViewMode("3D")}
            style={{
              padding: "9px 18px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              background:
                viewMode === "3D"
                  ? "#2563eb"
                  : "#ffffff",
              color:
                viewMode === "3D"
                  ? "#ffffff"
                  : "#333333",
              fontWeight: 600,
            }}
          >
            3D View
          </button>
        </div>
      </div>

      {/* Main Workspace */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
        }}
      >
        {viewMode === "2D" ? (
          <Editor />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 3D Project Header */}

            <div
              style={{
                height: "45px",
                minHeight: "45px",
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                background: "#ffffff",
                borderBottom: "1px solid #ddd",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {project.name || "Untitled Project"}
              </span>

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                {project.furniture.length} furniture item
                {project.furniture.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            {/* 3D Scene */}

            <div
              style={{
                flex: 1,
                minHeight: 0,
              }}
            >
              <Suspense
                fallback={
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    Loading 3D scene...
                  </div>
                }
              >
                <RoomScene
                  furniture={project.furniture}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}