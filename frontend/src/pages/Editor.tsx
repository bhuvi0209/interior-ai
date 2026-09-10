import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import Moveable from "react-moveable";
import { useProject } from "../context/ProjectContext";
import FurnitureLibrary from "../components/FurnitureLibrary";
import { furnitureLibrary } from "../data/furnitureData";

import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  GRID_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  SCALE_STEP,
} from "../constants/editor";

import { snapToGrid } from "../utils/editorUtils";
import "./Editor.css";

function getFurnitureEmoji(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("sofa")) return "🛋️";
  if (lowerName.includes("chair")) return "🪑";
  if (lowerName.includes("table")) return "🪵";
  if (lowerName.includes("bed")) return "🛏️";
  if (lowerName.includes("lamp")) return "💡";
  if (lowerName.includes("plant")) return "🌱";
  if (lowerName.includes("wardrobe")) return "🚪";

  return "🪑";
}

function keepInsideRoom(x: number, y: number) {
  return {
    x: Math.max(0, Math.min(x, ROOM_WIDTH)),
    y: Math.max(0, Math.min(y, ROOM_HEIGHT)),
  };
}

function Editor() {
  const { project, setProject } = useProject();

  const [selectedId, setSelectedId] =
    useState<string | number | null>(null);

  const [target, setTarget] =
    useState<HTMLElement | null>(null);

  const [zoom, setZoom] = useState(1);

  const [showGrid, setShowGrid] = useState(true);

  const [draggingId, setDraggingId] =
    useState<string | number | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------
  // Update furniture helper
  // --------------------------------

  const updateFurniture = (
    id: string | number,
    changes: Record<string, unknown>
  ) => {
    setProject((currentProject) => ({
      ...currentProject,
      furniture: currentProject.furniture.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item
      ),
    }));
  };

  // --------------------------------
  // Add furniture
  // --------------------------------

  const handleAddFurniture = (furnitureId: string) => {
    const definition = furnitureLibrary.find(
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
      scale: definition.defaultScale ?? 1,
      image2D: definition.image2D,
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
  };

  // --------------------------------
  // Start dragging furniture
  // --------------------------------

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    furnitureId: string | number
  ) => {
    event.stopPropagation();

    setSelectedId(furnitureId);
    setDraggingId(furnitureId);

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  // --------------------------------
  // Move furniture
  // --------------------------------

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      draggingId === null ||
      !stageRef.current
    ) {
      return;
    }

    const rect =
      stageRef.current.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) / zoom;

    const y =
      (event.clientY - rect.top) / zoom;

    const snappedX = snapToGrid(
      x,
      GRID_SIZE
    );

    const snappedY = snapToGrid(
      y,
      GRID_SIZE
    );

    const position = keepInsideRoom(
      snappedX,
      snappedY
    );

    updateFurniture(
      draggingId,
      {
        x: position.x,
        y: position.y,
      }
    );
  };

  // --------------------------------
  // Stop dragging
  // --------------------------------

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    setDraggingId(null);

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture may already be released.
    }
  };

  // --------------------------------
  // Rotation
  // --------------------------------

  const updateRotation = (value: number) => {
    if (selectedId === null) return;

    updateFurniture(
      selectedId,
      {
        rotation: value,
      }
    );
  };

  // --------------------------------
  // Scale
  // --------------------------------

  const updateScale = (value: number) => {
    if (selectedId === null) return;

    updateFurniture(
      selectedId,
      {
        scale: value,
      }
    );
  };

  // --------------------------------
  // Delete selected furniture
  // --------------------------------

  const deleteSelectedFurniture = () => {
    if (selectedId === null) return;

    setProject((currentProject) => ({
      ...currentProject,
      furniture:
        currentProject.furniture.filter(
          (item) => item.id !== selectedId
        ),
    }));

    setSelectedId(null);
    setTarget(null);
  };

  // --------------------------------
  // Selected furniture
  // --------------------------------

  const selectedFurniture =
    project.furniture.find(
      (item) => item.id === selectedId
    );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      {/* ================================= */}
      {/* LEFT - Furniture Library */}
      {/* ================================= */}

      <FurnitureLibrary
        onAddFurniture={handleAddFurniture}
      />

      {/* ================================= */}
      {/* CENTER - 2D Editor */}
      {/* ================================= */}

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
          Drag furniture to position it in your room.
        </p>

        {/* Editor controls */}

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
            onClick={() =>
              setZoom((value) =>
                Math.min(2, value + 0.1)
              )
            }
          >
            +
          </button>

          <button
            onClick={() => setZoom(1)}
          >
            Reset Zoom
          </button>

          <button
            onClick={() =>
              setShowGrid((value) => !value)
            }
          >
            {showGrid
              ? "Hide Grid"
              : "Show Grid"}
          </button>
        </div>

        {/* Room dimensions */}

        <div
          style={{
            marginBottom: "10px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          Room: {ROOM_WIDTH} × {ROOM_HEIGHT}
        </div>

        {/* ================================= */}
        {/* ROOM */}
        {/* ================================= */}

        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={() => {
            setSelectedId(null);
            setTarget(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
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
            cursor:
              draggingId !== null
                ? "grabbing"
                : "default",
          }}
        >
          {/* ================================= */}
          {/* GRID */}
          {/* ================================= */}

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

          {/* ================================= */}
          {/* FURNITURE */}
          {/* ================================= */}

          {project.furniture.map((item) => (
            <div
              key={item.id}
              data-furniture-id={item.id}
              onClick={(event) => {
                event.stopPropagation();

                setSelectedId(item.id);
                setTarget(event.currentTarget);
              }}
              onPointerDown={(event) =>
                handlePointerDown(
                  event,
                  item.id
                )
              }
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,

                transform: `
                  translate(-50%, -50%)
                  rotate(${item.rotation ?? 0}deg)
                  scale(${item.scale ?? 1})
                `,

                cursor:
                  draggingId === item.id
                    ? "grabbing"
                    : "grab",

                border:
                  selectedId === item.id
                    ? "2px solid #333"
                    : "none",

                padding: "20px",

                borderRadius: "8px",

                background:
                  selectedId === item.id
                    ? "#eef4ff"
                    : "transparent",

                userSelect: "none",

                zIndex:
                  selectedId === item.id
                    ? 10
                    : 1,
              }}
            >
              {getFurnitureEmoji(item.name)}{" "}
              {item.name}

              {/* Rotation handle */}

              {selectedId === item.id && (
                <div
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  style={{
                    position: "absolute",
                    top: "-35px",
                    left: "50%",
                    transform:
                      "translateX(-50%)",
                    fontSize: "20px",
                    cursor: "pointer",
                  }}
                >
                  ↻
                </div>
              )}

              {/* Resize handles */}

              {selectedId === item.id && (
                <>
                  <div
                    className="resize-handle top-left"
                    onPointerDown={(event) =>
                      event.stopPropagation()
                    }
                  />

                  <div
                    className="resize-handle top-right"
                    onPointerDown={(event) =>
                      event.stopPropagation()
                    }
                  />

                  <div
                    className="resize-handle bottom-left"
                    onPointerDown={(event) =>
                      event.stopPropagation()
                    }
                  />

                  <div
                    className="resize-handle bottom-right"
                    onPointerDown={(event) =>
                      event.stopPropagation()
                    }
                  />
                </>
              )}
            </div>
          ))}

          {/* ================================= */}
          {/* MOVEABLE */}
          {/* IMPORTANT: OUTSIDE furniture.map */}
          {/* ================================= */}

          {target && selectedId !== null && (
            <Moveable
              target={target}
              draggable={true}
              resizable={true}
              rotatable={true}
              origin={false}

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

      {/* ================================= */}
      {/* RIGHT - Properties */}
      {/* ================================= */}

      <div
        style={{
          width: "260px",
          padding: "24px",
          background: "white",
          borderLeft: "1px solid #ddd",
        }}
      >
        <h2>
          Furniture Properties
        </h2>

        {!selectedFurniture && (
          <p
            style={{
              color: "#666",
            }}
          >
            Select a furniture item
            to edit its properties.
          </p>
        )}

        {selectedFurniture && (
          <>
            <h3>
              {getFurnitureEmoji(
                selectedFurniture.name
              )}{" "}
              {selectedFurniture.name}
            </h3>

            {/* X Position */}

            <label>
              X Position
            </label>

            <input
              type="number"
              value={selectedFurniture.x}
              onChange={(event) =>
                updateFurniture(
                  selectedFurniture.id,
                  {
                    x: Number(
                      event.target.value
                    ),
                  }
                )
              }
              style={{
                width: "100%",
                marginBottom: "12px",
              }}
            />

            {/* Y Position */}

            <label>
              Y Position
            </label>

            <input
              type="number"
              value={selectedFurniture.y}
              onChange={(event) =>
                updateFurniture(
                  selectedFurniture.id,
                  {
                    y: Number(
                      event.target.value
                    ),
                  }
                )
              }
              style={{
                width: "100%",
                marginBottom: "12px",
              }}
            />

            {/* Rotation */}

            <label>
              Rotation:{" "}
              {selectedFurniture.rotation ?? 0}°
            </label>

            <input
              type="range"
              min="0"
              max="360"
              value={
                selectedFurniture.rotation ?? 0
              }
              onChange={(event) =>
                updateRotation(
                  Number(
                    event.target.value
                  )
                )
              }
              style={{
                width: "100%",
                marginBottom: "12px",
              }}
            />

            {/* Scale */}

            <label>
              Scale:{" "}
              {(
                selectedFurniture.scale ?? 1
              ).toFixed(1)}
            </label>

            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={SCALE_STEP}
              value={
                selectedFurniture.scale ?? 1
              }
              onChange={(event) =>
                updateScale(
                  Number(
                    event.target.value
                  )
                )
              }
              style={{
                width: "100%",
                marginBottom: "20px",
              }}
            />

            {/* Delete */}

            <button
              onClick={
                deleteSelectedFurniture
              }
              style={{
                width: "100%",
                padding: "10px",
                background: "#e53935",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Delete Furniture
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Editor;