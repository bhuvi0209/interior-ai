
import { useState } from "react";
import Editor from "./Editor";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type ViewMode = "2D" | "3D";
type TransformMode = "translate" | "rotate";

export default function DesignWorkspace() {
  const { project, setProject } = useProject();

  const [viewMode, setViewMode] = useState<ViewMode>("2D");
  const [selectedId, setSelectedId] = useState<
    string | number | null
  >(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

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
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: "#20242c",
          color: "white",
        }}
      >
        <strong style={{ marginRight: "auto" }}>
          {project.name || "Untitled Project"}
        </strong>

        <button onClick={() => setViewMode("2D")}>
          2D View
        </button>

        <button onClick={() => setViewMode("3D")}>
          3D View
        </button>

        {viewMode === "3D" && (
          <>
            <button
              onClick={() => setTransformMode("translate")}
            >
              Move
            </button>

            <button
              onClick={() => setTransformMode("rotate")}
            >
              Rotate
            </button>

            <button onClick={() => setSelectedId(null)}>
              Deselect
            </button>
          </>
        )}
      </header>

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
              height: "calc(100vh - 60px)",
              minHeight: "600px",
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
        )}
      </main>
    </div>
  );
}