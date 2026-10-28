import { useEffect, useState } from "react";

import Editor from "./Editor";

import FurnitureProperties from "../components/FurnitureProperties";

import RoomScene from "../3d/RoomScene";

import { useProject } from "../context/ProjectContext";
import FurnitureArrangementScore from "../components/FurnitureArrangementScore";
import FurnitureCollisionDetector from "../components/FurnitureCollisionDetector";
import RoomPresets from "../components/RoomPresets";
import FurnitureArrangementValidator from "../components/FurnitureArrangementValidator";
import type { RoomPreset } from "../types/RoomPreset";
import FurnitureSpaceChecker from "../components/FurnitureSpaceChecker";
type ViewMode = "2D" | "3D";

type TransformMode = "translate" | "rotate";

type CameraView = "perspective" | "top" | "front";

export default function DesignWorkspace() {

  const { project, setProject } = useProject();

  // View and selection state

  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const [transformMode, setTransformMode] =

    useState<TransformMode>("translate");

  const [cameraView, setCameraView] =

    useState<CameraView>("perspective");

  // Editable room dimension inputs

  const [roomWidthInput, setRoomWidthInput] = useState(

    String(project.room.width)

  );

  const [roomDepthInput, setRoomDepthInput] = useState(

    String(project.room.depth)

  );

  const [wallHeightInput, setWallHeightInput] = useState(

    String(project.room.wallHeight)

  );

  const [roomValidationError, setRoomValidationError] =

    useState<string | null>(null);

  // Find selected furniture

  const selectedFurniture = project.furniture.find(

    (item) => item.id === selectedId

  );

  // Update furniture properties

  const updateFurniture = (

    id: string | number,

    updates: Partial<(typeof project.furniture)[number]>

  ) => {

    setProject((current) => ({

      ...current,

      furniture: current.furniture.map((item) =>

        item.id === id ? { ...item, ...updates } : item

      ),

    }));

  };

  // Update room dimensions

  const updateRoom = (updates: Partial<typeof project.room>) => {

    setProject((current) => ({

      ...current,

      room: {

        ...current.room,

        ...updates,

      },

    }));

  };

  // Apply a selected room preset

  const handleApplyPreset = (preset: RoomPreset) => {

    setRoomValidationError(null);

    updateRoom({

      width: preset.width,

      depth: preset.depth,

      wallHeight: preset.wallHeight,

    });

  };

  // Keep inputs synchronized when presets, reset, or project loading

  // changes the saved room dimensions.

  useEffect(() => {

    setRoomWidthInput(String(project.room.width));

    setRoomDepthInput(String(project.room.depth));

    setWallHeightInput(String(project.room.wallHeight));

    setRoomValidationError(null);

  }, [

    project.room.width,

    project.room.depth,

    project.room.wallHeight,

  ]);

  // Validate dimensions when the user leaves an input field

  const commitRoomNumber = (

    value: string,

    field: "width" | "depth" | "wallHeight"

  ) => {

    const maxValue = field === "wallHeight" ? 1000 : 2000;

    const numberValue = Number(value);

    const fieldLabel =

      field === "width"

        ? "Room width"

        : field === "depth"

          ? "Room depth"

          : "Wall height";

    if (

      value.trim() === "" ||

      !Number.isFinite(numberValue) ||

      numberValue < 100 ||

      numberValue > maxValue

    ) {

      setRoomValidationError(

        `${fieldLabel} must be between 100 and ${maxValue} cm.`

      );

      // Restore the last committed value

      if (field === "width") {

        setRoomWidthInput(String(project.room.width));

      } else if (field === "depth") {

        setRoomDepthInput(String(project.room.depth));

      } else {

        setWallHeightInput(String(project.room.wallHeight));

      }

      return;

    }

    setRoomValidationError(null);

    updateRoom({ [field]: numberValue });

  };

  // Save the final position and rotation of furniture in the 3D scene

  const handleTransformEnd = (

    id: string | number,

    x: number,

    y: number,

    rotation: number

  ) => {

    updateFurniture(id, { x, y, rotation });

  };

  // Delete selected furniture

  const handleDeleteSelected = () => {

    if (selectedId === null) return;

    setProject((current) => ({

      ...current,

      furniture: current.furniture.filter(

        (item) => item.id !== selectedId

      ),

    }));

    setSelectedId(null);

  };

  // Duplicate selected furniture

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

  // Lock or unlock selected furniture

  const handleToggleLock = () => {

    if (!selectedFurniture) return;

    updateFurniture(selectedFurniture.id, {

      locked: !selectedFurniture.locked,

    });

  };

  // Hide or show selected furniture

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

  // Clear current selection

  const handleClearSelection = () => {

    setSelectedId(null);

  };

  // Keyboard shortcuts

  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {

      const target = event.target as HTMLElement | null;

      // Do not run shortcuts while typing in form controls

      if (

        target?.tagName === "INPUT" ||

        target?.tagName === "TEXTAREA" ||

        target?.tagName === "SELECT" ||

        target?.isContentEditable

      ) {

        return;

      }

      // Ctrl+D or Cmd+D: duplicate

      if (

        (event.ctrlKey || event.metaKey) &&

        event.key.toLowerCase() === "d"

      ) {

        event.preventDefault();

        handleDuplicateSelected();

        return;

      }

      // Delete or Backspace: delete selected furniture

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

      // Escape: deselect

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

      {/* Toolbar */}

      <div

        style={{

          display: "flex",

          alignItems: "center",

          gap: "8px",

          padding: "10px 14px",

          borderBottom: "1px solid #ddd",

          background: "#fff",

          flexWrap: "wrap",

        }}

      >

        <button

          type="button"

          onClick={() => setViewMode("2D")}

          style={{

            padding: "8px 14px",

            fontWeight: viewMode === "2D" ? 700 : 400,

          }}

        >

          2D

        </button>

        <button

          type="button"

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

        <button

          type="button"

          onClick={() => setTransformMode("translate")}

          disabled={selectedFurniture?.locked ?? false}

          style={{ padding: "8px 12px" }}

        >

          Move

        </button>

        <button

          type="button"

          onClick={() => setTransformMode("rotate")}

          disabled={selectedFurniture?.locked ?? false}

          style={{ padding: "8px 12px" }}

        >

          Rotate

        </button>

        <button

          type="button"

          onClick={handleDuplicateSelected}

          disabled={!selectedFurniture}

          style={{ padding: "8px 12px" }}

        >

          Duplicate

        </button>

        <button

          type="button"

          onClick={handleDeleteSelected}

          disabled={!selectedFurniture}

          style={{ padding: "8px 12px" }}

        >

          Delete

        </button>

        <button

          type="button"

          onClick={handleToggleLock}

          disabled={!selectedFurniture}

          style={{ padding: "8px 12px" }}

        >

          {selectedFurniture?.locked ? "Unlock" : "Lock"}

        </button>

        <button

          type="button"

          onClick={handleToggleVisibility}

          disabled={!selectedFurniture}

          style={{ padding: "8px 12px" }}

        >

          {selectedFurniture?.visible ? "Hide" : "Show"}

        </button>

        <button

          type="button"

          onClick={handleClearSelection}

          disabled={!selectedFurniture}

          style={{ padding: "8px 12px" }}

        >

          Deselect

        </button>

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

              type="button"

              onClick={() => setCameraView("perspective")}

              style={{

                padding: "8px 12px",

                fontWeight: cameraView === "perspective" ? 700 : 400,

              }}

            >

              Perspective

            </button>

            <button

              type="button"

              onClick={() => setCameraView("top")}

              style={{

                padding: "8px 12px",

                fontWeight: cameraView === "top" ? 700 : 400,

              }}

            >

              Top

            </button>

            <button

              type="button"

              onClick={() => setCameraView("front")}

              style={{

                padding: "8px 12px",

                fontWeight: cameraView === "front" ? 700 : 400,

              }}

            >

              Front

            </button>

          </>

        )}

      </div>

      {/* Main content */}

      <div

        style={{

          display: "flex",

          flex: 1,

          minHeight: 0,

          overflow: "hidden",

        }}

      >

        {/* 2D editor or 3D scene */}

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

              roomWidth={project.room.width}

              roomDepth={project.room.depth}

              wallHeight={project.room.wallHeight}

              onSelect={setSelectedId}

              onClearSelection={handleClearSelection}

              onTransformEnd={handleTransformEnd}

            />

          )}

        </div>

        {/* Right sidebar */}

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

          {/* Furniture properties */}

          {selectedFurniture && (

            <FurnitureProperties

              selectedId={selectedId}

              onClose={handleClearSelection}

            />

          )}

          {/* Room settings */}

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
<FurnitureCollisionDetector
  currentRoom={project.room}
  furniture={project.furniture}
/>
<FurnitureArrangementValidator
  currentRoom={project.room}
  furniture={project.furniture}
/>
<FurnitureArrangementScore
  currentRoom={project.room}
  furniture={project.furniture}
/>
  <RoomPresets
  currentRoom={project.room}
  onApply={handleApplyPreset}
/>
<FurnitureSpaceChecker
  currentRoom={project.room}
  furniture={project.furniture}
/>
            {/* Room width */}

            <div style={{ marginBottom: "14px" }}>

              <label

                htmlFor="room-width"

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

                id="room-width"

                type="number"

                min={100}

                max={2000}

                step={1}

                value={roomWidthInput}

                onChange={(event) => {

                  setRoomWidthInput(event.target.value);

                  setRoomValidationError(null);

                }}

                onBlur={() =>

                  commitRoomNumber(roomWidthInput, "width")

                }

                style={{

                  width: "100%",

                  padding: "8px",

                  boxSizing: "border-box",

                }}

              />

            </div>

            {/* Room depth */}

            <div style={{ marginBottom: "14px" }}>

              <label

                htmlFor="room-depth"

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

                id="room-depth"

                type="number"

                min={100}

                max={2000}

                step={1}

                value={roomDepthInput}

                onChange={(event) => {

                  setRoomDepthInput(event.target.value);

                  setRoomValidationError(null);

                }}

                onBlur={() =>

                  commitRoomNumber(roomDepthInput, "depth")

                }

                style={{

                  width: "100%",

                  padding: "8px",

                  boxSizing: "border-box",

                }}

              />

            </div>

            {/* Wall height */}

            <div style={{ marginBottom: "14px" }}>

              <label

                htmlFor="wall-height"

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

                id="wall-height"

                type="number"

                min={100}

                max={1000}

                step={1}

                value={wallHeightInput}

                onChange={(event) => {

                  setWallHeightInput(event.target.value);

                  setRoomValidationError(null);

                }}

                onBlur={() =>

                  commitRoomNumber(wallHeightInput, "wallHeight")

                }

                style={{

                  width: "100%",

                  padding: "8px",

                  boxSizing: "border-box",

                }}

              />

            </div>

            {/* Validation error */}

            {roomValidationError && (

              <p

                role="alert"

                style={{

                  margin: "0 0 12px",

                  padding: "10px",

                  border: "1px solid #e5a5a5",

                  borderRadius: "6px",

                  background: "#fff1f1",

                  color: "#9b1c1c",

                  fontSize: "12px",

                }}

              >

                {roomValidationError}

              </p>

            )}

            {/* Reset room dimensions */}

            <button

              type="button"

              onClick={() => {

                setRoomValidationError(null);

                updateRoom({

                  width: 800,

                  depth: 500,

                  wallHeight: 300,

                });

              }}

              style={{

                width: "100%",

                padding: "10px",

                marginTop: "4px",

                border: "none",

                borderRadius: "6px",

                backgroundColor: "#333",

                color: "#fff",

                cursor: "pointer",

              }}

            >

              Reset Room Size

            </button>

            {/* Current room summary */}

            <div

              style={{

                marginTop: "16px",

                padding: "12px",

                background: "#fff",

                border: "1px solid #ddd",

                borderRadius: "6px",

                fontSize: "13px",

                lineHeight: 1.6,

              }}

            >

              <strong>Current Room</strong>

              <div>Width: {project.room.width} cm</div>

              <div>Depth: {project.room.depth} cm</div>

              <div>Wall Height: {project.room.wallHeight} cm</div>

            </div>

          </div>

        </aside>

      </div>

    </div>

  );

}
