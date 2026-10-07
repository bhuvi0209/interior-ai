import { useEffect, useState } from "react";
import Editor from "./Editor";
import FurnitureProperties from "../components/FurnitureProperties";
import RoomScene from "../3d/RoomScene";
import { useProject } from "../context/ProjectContext";

type ViewMode = "2D" | "3D";
type TransformMode = "translate" | "rotate";
type CameraView = "perspective" | "top" | "front";

export default function DesignWorkspace() {
  const { project, setProject } = useProject();

  const [viewMode, setViewMode] = useState<ViewMode>("2D");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const [cameraView, setCameraView] =
    useState<CameraView>("perspective");

  const selectedFurniture = project.furniture.find(
    (item) => item.id === selectedId
  );

  // --------------------------------------------------
  // 3D TRANSFORM UPDATE
  // --------------------------------------------------

  const handleTransformEnd = (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => {
    setProject((current) => ({
      ...current,
      furniture: current.furniture.map((item) =>
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

  // --------------------------------------------------
  // UPDATE FURNITURE PROPERTY
  // --------------------------------------------------

  const updateFurniture = (
    id: string | number,
    updates: Partial<(typeof project.furniture)[number]>
  ) => {
    setProject((current) => ({
      ...current,
      furniture: current.furniture.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item
      ),
    }));
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDeleteSelected = () => {
    if (!selectedFurniture) return;

    setProject((current) => ({
      ...current,
      furniture: current.furniture.filter(
        (item) => item.id !== selectedFurniture.id
      ),
    }));

    setSelectedId(null);
  };

  // --------------------------------------------------
  // DUPLICATE
  // --------------------------------------------------

  const handleDuplicateSelected = () => {
    if (!selectedFurniture) return;

    const duplicate = {
      ...selectedFurniture,
      id: `${selectedFurniture.id}-copy-${Date.now()}`,
      x: selectedFurniture.x + 40,
      y: selectedFurniture.y + 40,
      locked: false,
      visible: true,
    };

    setProject((current) => ({
      ...current,
      furniture: [...current.furniture, duplicate],
    }));

    setSelectedId(duplicate.id);
  };

  // --------------------------------------------------
  // LOCK / UNLOCK
  // --------------------------------------------------

  const handleToggleLock = () => {
    if (!selectedFurniture) return;

    updateFurniture(selectedFurniture.id, {
      locked: !selectedFurniture.locked,
    });
  };

  // --------------------------------------------------
  // HIDE / SHOW
  // --------------------------------------------------

  const handleToggleVisibility = () => {
    if (!selectedFurniture) return;

    const newVisible = !selectedFurniture.visible;

    updateFurniture(selectedFurniture.id, {
      visible: newVisible,
    });

    if (!newVisible) {
      setSelectedId(null);
    }
  };

  // --------------------------------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedFurniture) {
          event.preventDefault();
          handleDeleteSelected();
        }
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d"
      ) {
        if (selectedFurniture) {
          event.preventDefault();
          handleDuplicateSelected();
        }
      }

      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedFurniture]);

  // --------------------------------------------------
  // TOOLBAR
  // --------------------------------------------------

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f4f4f4",
      }}
    >
      {/* TOP TOOLBAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          background: "#ffffff",
          borderBottom: "1px solid #ddd",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ marginRight: "12px" }}>
          Design Workspace
        </strong>

        {/* 2D / 3D */}
        <button
          onClick={() => setViewMode("2D")}
          style={{
            padding: "7px 12px",
            fontWeight: viewMode === "2D" ? "bold" : "normal",
          }}
        >
          2D
        </button>

        <button
          onClick={() => setViewMode("3D")}
          style={{
            padding: "7px 12px",
            fontWeight: viewMode === "3D" ? "bold" : "normal",
          }}
        >
          3D
        </button>

        <span
          style={{
            width: "1px",
            height: "28px",
            background: "#ddd",
            margin: "0 6px",
          }}
        />

        {/* TRANSFORM */}
        <button
          disabled={!selectedFurniture || selectedFurniture.locked}
          onClick={() => setTransformMode("translate")}
          style={{
            padding: "7px 12px",
            opacity:
              !selectedFurniture || selectedFurniture.locked
                ? 0.5
                : 1,
          }}
        >
          Move
        </button>

        <button
          disabled={!selectedFurniture || selectedFurniture.locked}
          onClick={() => setTransformMode("rotate")}
          style={{
            padding: "7px 12px",
            opacity:
              !selectedFurniture || selectedFurniture.locked
                ? 0.5
                : 1,
          }}
        >
          Rotate
        </button>

        {/* DUPLICATE */}
        <button
          disabled={!selectedFurniture}
          onClick={handleDuplicateSelected}
          style={{
            padding: "7px 12px",
            opacity: !selectedFurniture ? 0.5 : 1,
          }}
        >
          Duplicate
        </button>

        {/* DELETE */}
        <button
          disabled={!selectedFurniture}
          onClick={handleDeleteSelected}
          style={{
            padding: "7px 12px",
            opacity: !selectedFurniture ? 0.5 : 1,
          }}
        >
          Delete
        </button>

        {/* LOCK */}
        <button
          disabled={!selectedFurniture}
          onClick={handleToggleLock}
          style={{
            padding: "7px 12px",
            opacity: !selectedFurniture ? 0.5 : 1,
          }}
        >
          {selectedFurniture?.locked ? "Unlock" : "Lock"}
        </button>

        {/* VISIBILITY */}
        <button
          disabled={!selectedFurniture}
          onClick={handleToggleVisibility}
          style={{
            padding: "7px 12px",
            opacity: !selectedFurniture ? 0.5 : 1,
          }}
        >
          {selectedFurniture?.visible ? "Hide" : "Show"}
        </button>

        {/* DESELECT */}
        <button
          disabled={!selectedFurniture}
          onClick={() => setSelectedId(null)}
          style={{
            padding: "7px 12px",
            opacity: !selectedFurniture ? 0.5 : 1,
          }}
        >
          Deselect
        </button>

        <span
          style={{
            width: "1px",
            height: "28px",
            background: "#ddd",
            margin: "0 6px",
          }}
        />

        {/* CAMERA */}
        <button
          onClick={() => setCameraView("perspective")}
          style={{
            padding: "7px 12px",
            fontWeight:
              cameraView === "perspective" ? "bold" : "normal",
          }}
        >
          Perspective
        </button>

        <button
          onClick={() => setCameraView("top")}
          style={{
            padding: "7px 12px",
            fontWeight: cameraView === "top" ? "bold" : "normal",
          }}
        >
          Top
        </button>

        <button
          onClick={() => setCameraView("front")}
          style={{
            padding: "7px 12px",
            fontWeight: cameraView === "front" ? "bold" : "normal",
          }}
        >
          Front
        </button>
      </div>

      {/* MAIN AREA */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* EDITOR / 3D */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
          }}
        >
          {viewMode === "2D" ? (
            <Editor />
          ) : (
            <RoomScene
              furniture={project.furniture}
              selectedId={selectedId}
              transformMode={transformMode}
              cameraView={cameraView}
              onSelect={setSelectedId}
              onClearSelection={() => setSelectedId(null)}
              onTransformEnd={handleTransformEnd}
            />
          )}
        </div>

        {/* PROPERTIES PANEL */}
        {/* PROPERTIES PANEL */}
{selectedFurniture && (
  <FurnitureProperties
    selectedId={selectedId}
    onClose={() => setSelectedId(null)}
  />
)}
      </div>
    </div>
  );
}