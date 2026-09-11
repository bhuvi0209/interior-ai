import { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import { useProject } from "../context/ProjectContext";
import FurnitureLibrary from "../components/FurnitureLibrary";
import FurnitureProperties from "../components/FurnitureProperties";

import { furnitureLibrary } from "../data/furnitureData";

import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  GRID_SIZE,
} from "../constants/editor";

import { snapToGrid } from "../utils/editorUtils";

import "./Editor.css";

// ---------------------------------------------
// FURNITURE EMOJI
// ---------------------------------------------

function getFurnitureEmoji(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("sofa")) return "🛋️";
  if (lowerName.includes("chair")) return "🪑";
  if (lowerName.includes("table")) return "🪵";
  if (lowerName.includes("bed")) return "🛏️";
  if (lowerName.includes("lamp")) return "💡";
  if (lowerName.includes("plant")) return "🌱";
  if (lowerName.includes("wardrobe")) return "🚪";
  if (lowerName.includes("rug")) return "🟫";
  if (lowerName.includes("tv")) return "📺";

  return "🪑";
}

// ---------------------------------------------
// KEEP FURNITURE INSIDE ROOM
// ---------------------------------------------

function keepInsideRoom(x: number, y: number) {
  return {
    x: Math.max(0, Math.min(x, ROOM_WIDTH)),
    y: Math.max(0, Math.min(y, ROOM_HEIGHT)),
  };
}

// ---------------------------------------------
// EDITOR
// ---------------------------------------------

function Editor() {
  const {
  project,
  setProject,
  undo,
  redo,
  canUndo,
  canRedo,
} = useProject();

  // Selected furniture ID
  const [selectedId, setSelectedId] =
    useState<string | number | null>(null);

  // DOM element controlled by Moveable
  const [target, setTarget] =
    useState<HTMLElement | null>(null);
useEffect(() => {
  const handleKeyDown = (
    event: KeyboardEvent
  ) => {
    // Do not use shortcuts while typing
    const target =
      event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA"
    ) {
      return;
    }

    // Undo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "z"
    ) {
      event.preventDefault();

      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }

      return;
    }

    // Redo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "y"
    ) {
      event.preventDefault();

      redo();

      return;
    }

    // Duplicate
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "d"
    ) {
      event.preventDefault();

      if (selectedId === null) {
        return;
      }

      const selectedFurniture =
        project.furniture.find(
          (item) =>
            item.id === selectedId
        );

      if (!selectedFurniture) {
        return;
      }

      setProject((currentProject) => ({
        ...currentProject,

        furniture: [
          ...currentProject.furniture,

          {
            ...selectedFurniture,
            id: Date.now(),
            x: selectedFurniture.x + 40,
            y: selectedFurniture.y + 40,
          },
        ],
      }));

      return;
    }

    // Delete
    if (
      event.key === "Delete" ||
      event.key === "Backspace"
    ) {
      if (selectedId === null) {
        return;
      }

      event.preventDefault();

      setProject((currentProject) => ({
        ...currentProject,

        furniture:
          currentProject.furniture.filter(
            (item) =>
              item.id !== selectedId
          ),
      }));

      setSelectedId(null);
      setTarget(null);

      return;
    }

    // Arrow movement
    if (selectedId === null) {
      return;
    }

    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case "ArrowLeft":
        dx = -10;
        break;

      case "ArrowRight":
        dx = 10;
        break;

      case "ArrowUp":
        dy = -10;
        break;

      case "ArrowDown":
        dy = 10;
        break;

      default:
        return;
    }

    event.preventDefault();

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === selectedId
              ? {
                  ...item,
                  x: item.x + dx,
                  y: item.y + dy,
                }
              : item
        ),
    }));
  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };
}, [
  project,
  selectedId,
  setProject,
  undo,
  redo,
]);
  // Zoom
  const [zoom, setZoom] = useState(1);

  // Grid
  const [showGrid, setShowGrid] = useState(true);

  // Room reference
  const stageRef =
    useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------
  // UPDATE FURNITURE
  // ---------------------------------------------

  const updateFurniture = (
    id: string | number,
    changes: Record<string, unknown>
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture: currentProject.furniture.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                ...changes,
              }
            : item
      ),
    }));
  };

  // ---------------------------------------------
  // ADD FURNITURE
  // ---------------------------------------------

  const handleAddFurniture = (
    furnitureId: string
  ) => {
    const definition =
      furnitureLibrary.find(
        (item) => item.id === furnitureId
      );

    if (!definition) return;

    const newFurniture = {
      id: Date.now(),

      name: definition.name,

      category: definition.category,

      x: ROOM_WIDTH / 2,

      y: ROOM_HEIGHT / 2,

      rotation: 0,

      scale:
        definition.defaultScale ?? 1,

      width: definition.width,

      depth: definition.depth,

      height: definition.height,

      model3D: definition.model3D,
    };

    setProject((currentProject) => ({
      ...currentProject,

      furniture: [
        ...currentProject.furniture,
        newFurniture,
      ],
    }));

    setSelectedId(newFurniture.id);

    // Moveable target will be assigned
    // when the furniture element is rendered.
    setTarget(null);
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#f5f5f5",
      }}
    >
      <div
  style={{
    display: "flex",
    gap: "8px",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    background: "#fff",
  }}
>
  <button
    onClick={undo}
    disabled={!canUndo}
    style={{
      padding: "8px 14px",
      cursor: canUndo
        ? "pointer"
        : "not-allowed",
    }}
  >
    ↩️ Undo
  </button>

  <button
    onClick={redo}
    disabled={!canRedo}
    style={{
      padding: "8px 14px",
      cursor: canRedo
        ? "pointer"
        : "not-allowed",
    }}
  >
    ↪️ Redo
  </button>
</div>
      {/* ========================================= */}
      {/* LEFT - FURNITURE LIBRARY */}
      {/* ========================================= */}

      <FurnitureLibrary
        onAddFurniture={handleAddFurniture}
      />

      {/* ========================================= */}
      {/* CENTER - 2D EDITOR */}
      {/* ========================================= */}

      <div
        style={{
          flex: 1,
          padding: "24px",
          overflow: "auto",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          2D Room Editor
        </h1>

        <p
          style={{
            color: "#666",
            marginTop: 0,
          }}
        >
          Drag, resize, and rotate furniture
          inside your room.
        </p>

        {/* ========================================= */}
        {/* EDITOR CONTROLS */}
        {/* ========================================= */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setZoom((value) =>
                Math.max(0.5, value - 0.1)
              )
            }
          >
            −
          </button>

          <span>
            Zoom: {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() =>
              setZoom((value) =>
                Math.min(2, value + 0.1)
              )
            }
          >
            +
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
          >
            Reset Zoom
          </button>

          <button
            type="button"
            onClick={() =>
              setShowGrid((value) => !value)
            }
          >
            {showGrid
              ? "Hide Grid"
              : "Show Grid"}
          </button>
        </div>

        {/* ========================================= */}
        {/* ROOM DIMENSIONS */}
        {/* ========================================= */}

        <div
          style={{
            marginBottom: "10px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          Room: {ROOM_WIDTH} × {ROOM_HEIGHT}
        </div>

        {/* ========================================= */}
        {/* ROOM */}
        {/* ========================================= */}

        <div
          ref={stageRef}
          onClick={() => {
            setSelectedId(null);
            setTarget(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();

            event.dataTransfer.dropEffect =
              "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();

            const furnitureId =
              event.dataTransfer.getData(
                "furnitureId"
              );

            if (furnitureId) {
              handleAddFurniture(
                furnitureId
              );
            }
          }}
          style={{
            width: ROOM_WIDTH,
            height: ROOM_HEIGHT,
            position: "relative",
            overflow: "hidden",
            border: "2px solid #333",
            backgroundColor: "#f8f8f8",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {/* ========================================= */}
          {/* GRID */}
          {/* ========================================= */}

          {showGrid && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",

                backgroundImage: `
                  linear-gradient(
                    rgba(0,0,0,0.12) 1px,
                    transparent 1px
                  ),
                  linear-gradient(
                    90deg,
                    rgba(0,0,0,0.12) 1px,
                    transparent 1px
                  )
                `,

                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
            />
          )}

          {/* ========================================= */}
          {/* FURNITURE */}
          {/* ========================================= */}

          {project.furniture.map((item) => (
            <div
              key={item.id}
              data-furniture-id={item.id}
              onClick={(event) => {
                event.stopPropagation();

                setSelectedId(item.id);

                setTarget(
                  event.currentTarget
                );
              }}
              style={{
                position: "absolute",

                left: item.x,

                top: item.y,

                transform: `
                  translate(-50%, -50%)
                  rotate(${item.rotation ?? 0}deg)
                  scale(${item.scale ?? 1})
                `,

                padding: "20px",

                borderRadius: "8px",

                border:
                  selectedId === item.id
                    ? "2px solid #333"
                    : "2px solid transparent",

                background:
                  selectedId === item.id
                    ? "#eef4ff"
                    : "transparent",

                cursor: "move",

                userSelect: "none",

                zIndex:
                  selectedId === item.id
                    ? 10
                    : 1,

                whiteSpace: "nowrap",
              }}
            >
              {getFurnitureEmoji(item.name)}{" "}
              {item.name}
            </div>
          ))}

          {/* ========================================= */}
          {/* MOVEABLE CONTROLS */}
          {/* ========================================= */}

          {target && selectedId !== null && (
            <Moveable
              target={target}
              draggable={true}
              resizable={true}
              rotatable={true}
              origin={false}

              // -----------------------------------
              // DRAG
              // -----------------------------------

              onDrag={({
                target,
                left,
                top,
              }) => {
                target.style.left =
                  `${left}px`;

                target.style.top =
                  `${top}px`;
              }}

              onDragEnd={({ lastEvent }) => {
                if (
                  !lastEvent ||
                  selectedId === null
                ) {
                  return;
                }

                const snappedX =
                  snapToGrid(
                    lastEvent.left,
                    GRID_SIZE
                  );

                const snappedY =
                  snapToGrid(
                    lastEvent.top,
                    GRID_SIZE
                  );

                const position =
                  keepInsideRoom(
                    snappedX,
                    snappedY
                  );

                updateFurniture(
                  selectedId,
                  position
                );
              }}

              // -----------------------------------
              // RESIZE
              // -----------------------------------

              onResize={({
                target,
                width,
                height,
              }) => {
                target.style.width =
                  `${width}px`;

                target.style.height =
                  `${height}px`;
              }}

              onResizeEnd={({ lastEvent }) => {
                if (
                  !lastEvent ||
                  selectedId === null
                ) {
                  return;
                }

                updateFurniture(
                  selectedId,
                  {
                    width:
                      lastEvent.width,

                    height:
                      lastEvent.height,
                  }
                );
              }}

              // -----------------------------------
              // ROTATE
              // -----------------------------------

              onRotate={({
                target,
                transform,
              }) => {
                target.style.transform =
                  transform;
              }}

              onRotateEnd={({
                lastEvent,
              }) => {
                if (
                  !lastEvent ||
                  selectedId === null
                ) {
                  return;
                }

                updateFurniture(
                  selectedId,
                  {
                    rotation:
                      lastEvent.rotation,
                  }
                );
              }}
            />
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* RIGHT - FURNITURE PROPERTIES */}
      {/* ========================================= */}

      {selectedId !== null && (
        <FurnitureProperties
          selectedId={selectedId}
          onClose={() => {
            setSelectedId(null);
            setTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default Editor;