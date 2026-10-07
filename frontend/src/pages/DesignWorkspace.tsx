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
  const [selectedId, setSelectedId] = useState<
    string | number | null
  >(null);

  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const [cameraView, setCameraView] =
    useState<CameraView>("perspective");

  const [roomWidth, setRoomWidth] = useState(800);
  const [roomDepth, setRoomDepth] = useState(500);
  const [wallHeight, setWallHeight] = useState(300);

  const selectedFurniture = project.furniture.find(
    (item) => item.id === selectedId
  );

  const updateFurniture = (
    id: string | number,
    updates: Partial<typeof project.furniture[number]>
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

  const handleTransformEnd = (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => {
    updateFurniture(id, {
      x,
      y,
      rotation,
    });
  };

  const handleDeleteSelected = () => {
    if (selectedId === null) {
      return;
    }

    setProject((current) => ({
      ...current,
      furniture: current.furniture.filter(
        (item) => item.id !== selectedId
      ),
    }));

    setSelectedId(null);
  };

  const handleDuplicateSelected = () => {
    if (!selectedFurniture) {
      return;
    }

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

  const handleToggleLock = () => {
    if (!selectedFurniture) {
      return;
    }

    updateFurniture(selectedFurniture.id, {
      locked: !selectedFurniture.locked,
    });
  };

  const handleToggleVisibility = () => {
    if (!selectedFurniture) {
      return;
    }

    const newVisible = !selectedFurniture.visible;

    updateFurniture(selectedFurniture.id, {
      visible: newVisible,
    });

    if (!newVisible) {
      setSelectedId(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedId(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        handleDuplicateSelected();
        return;
      }

      if (
        event.key === "Delete" ||
        event.key === "Backspace"
      ) {
        if (selectedId !== null) {
          event.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, selectedFurniture]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* TOOLBAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderBottom: "1px solid #ddd",
          background: "#ffffff",
          flexWrap: "wrap",
        }}
      >
        {/* VIEW MODE */}
        <button
          onClick={() => setViewMode("2D")}
          style={{
            padding: "8px 14px",
            fontWeight: viewMode === "2D" ? 700 : 400,
          }}
        >
          2D
        </button>

        <button
          onClick={() => setViewMode("3D")}
          style={{
            padding: "8px 14px",
            fontWeight: viewMode === "3D" ? 700 : 400,
          }}
        >
          3D
        </button>

        <div
          style={{
            width: "1px",
            height: "28px",
            background: "#ddd",
            margin: "0 4px",
          }}
        />

        {/* TRANSFORM */}
        <button
          onClick={() => setTransformMode("translate")}
          disabled={selectedFurniture?.locked ?? false}
          style={{
            padding: "8px 12px",
          }}
        >
          Move
        </button>

        <button
          onClick={() => setTransformMode("rotate")}
          disabled={selectedFurniture?.locked ?? false}
          style={{
            padding: "8px 12px",
          }}
        >
          Rotate
        </button>

        <button
          onClick={handleDuplicateSelected}
          disabled={!selectedFurniture}
          style={{
            padding: "8px 12px",
          }}
        >
          Duplicate
        </button>

        <button
          onClick={handleDeleteSelected}
          disabled={!selectedFurniture}
          style={{
            padding: "8px 12px",
          }}
        >
          Delete
        </button>

        <button
          onClick={handleToggleLock}
          disabled={!selectedFurniture}
          style={{
            padding: "8px 12px",
          }}
        >
          {selectedFurniture?.locked ? "Unlock" : "Lock"}
        </button>

        <button
          onClick={handleToggleVisibility}
          disabled={!selectedFurniture}
          style={{
            padding: "8px 12px",
          }}
        >
          {selectedFurniture?.visible ? "Hide" : "Show"}
        </button>

        <button
          onClick={handleClearSelection}
          disabled={!selectedFurniture}
          style={{
            padding: "8px 12px",
          }}
        >
          Deselect
        </button>

        {/* CAMERA */}
        {viewMode === "3D" && (
          <>
            <div
              style={{
                width: "1px",
                height: "28px",
                background: "#ddd",
                margin: "0 4px",
              }}
            />

            <button
              onClick={() => setCameraView("perspective")}
              style={{
                padding: "8px 12px",
                fontWeight:
                  cameraView === "perspective" ? 700 : 400,
              }}
            >
              Perspective
            </button>

            <button
              onClick={() => setCameraView("top")}
              style={{
                padding: "8px 12px",
                fontWeight:
                  cameraView === "top" ? 700 : 400,
              }}
            >
              Top
            </button>

            <button
              onClick={() => setCameraView("front")}
              style={{
                padding: "8px 12px",
                fontWeight:
                  cameraView === "front" ? 700 : 400,
              }}
            >
              Front
            </button>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* EDITOR / 3D VIEW */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
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
              roomWidth={roomWidth}
              roomDepth={roomDepth}
              wallHeight={wallHeight}
              onSelect={setSelectedId}
              onClearSelection={handleClearSelection}
              onTransformEnd={handleTransformEnd}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside
          style={{
            width: "300px",
            minWidth: "300px",
            borderLeft: "1px solid #ddd",
            background: "#fafafa",
            padding: "16px",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {/* FURNITURE PROPERTIES */}
          {selectedFurniture && (
            <FurnitureProperties
              selectedId={selectedId}
              onClose={handleClearSelection}
            />
          )}

          {/* ROOM SETTINGS */}
          <div
            style={{
              marginTop: selectedFurniture ? "24px" : "0",
              borderTop: "1px solid #ddd",
              paddingTop: "16px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
              }}
            >
              Room Settings
            </h3>

            {/* ROOM WIDTH */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Room Width (cm)
              </label>

              <input
                type="number"
                min="100"
                value={roomWidth}
                onChange={(event) =>
                  setRoomWidth(Number(event.target.value))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* ROOM DEPTH */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Room Depth (cm)
              </label>

              <input
                type="number"
                min="100"
                value={roomDepth}
                onChange={(event) =>
                  setRoomDepth(Number(event.target.value))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* WALL HEIGHT */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                Wall Height (cm)
              </label>

              <input
                type="number"
                min="100"
                value={wallHeight}
                onChange={(event) =>
                  setWallHeight(Number(event.target.value))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}