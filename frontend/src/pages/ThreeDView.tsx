
import { useState } from "react";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

export default function ThreeDView() {
  const { project, setProject } = useProject();

  const [selectedId, setSelectedId] =
    useState<string | number | null>(null);

  const [transformMode, setTransformMode] =
    useState<"translate" | "rotate">("translate");

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
          ? { ...item, x, y, rotation }
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
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "12px",
          background: "#ffffff",
        }}
      >
        <button onClick={() => setTransformMode("translate")}>
          Move
        </button>

        <button onClick={() => setTransformMode("rotate")}>
          Rotate
        </button>

        <button onClick={() => setSelectedId(null)}>
          Deselect
        </button>
      </div>

      <div style={{ flex: 1, minHeight: "600px" }}>
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