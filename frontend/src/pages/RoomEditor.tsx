import { useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Rect,
  Line,
} from "react-konva";

import useImage from "use-image";

import { useProject } from "../context/ProjectContext";

function RoomBackground({
  imageUrl,
  width,
  height,
}: {
  imageUrl: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(imageUrl);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={width}
      height={height}
    />
  );
}

function RoomEditor() {
  const { project, setProject } = useProject();

  // ---------------------------------------------
  // SELECTED FURNITURE
  // ---------------------------------------------

  const [selectedId, setSelectedId] =
    useState<string | number | null>(null);

  // ---------------------------------------------
  // EDITOR STATE
  // ---------------------------------------------

  const [zoom, setZoom] = useState(1);

  const [showGrid, setShowGrid] = useState(true);

  const canvasWidth = 800;
  const canvasHeight = 500;

  // ---------------------------------------------
  // SELECTED FURNITURE
  // ---------------------------------------------

  const selectedFurniture =
    project.furniture.find(
      (item) => item.id === selectedId
    );

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
  // DELETE FURNITURE
  // ---------------------------------------------

  const deleteFurniture = () => {
    if (selectedId === null) {
      return;
    }

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.filter(
          (item) => item.id !== selectedId
        ),
    }));

    setSelectedId(null);
  };

  // ---------------------------------------------
  // ROTATE FURNITURE
  // ---------------------------------------------

  const rotateFurniture = () => {
    if (!selectedFurniture) {
      return;
    }

    const currentRotation =
      selectedFurniture.rotation ?? 0;

    updateFurniture(selectedFurniture.id, {
      rotation: currentRotation + 15,
    });
  };

  // ---------------------------------------------
  // RESIZE FURNITURE
  // ---------------------------------------------

  const resizeFurniture = (
    amount: number
  ) => {
    if (!selectedFurniture) {
      return;
    }

    const currentScale =
      selectedFurniture.scale ?? 1;

    const newScale = Math.max(
      0.5,
      Math.min(2, currentScale + amount)
    );

    updateFurniture(selectedFurniture.id, {
      scale: newScale,
    });
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1>2D Room Editor</h1>

      <p>
        Arrange your furniture and create your room
        layout.
      </p>

      {/* ========================================= */}
      {/* TOOLBAR */}
      {/* ========================================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setZoom((value) =>
              Math.min(value + 0.1, 2)
            )
          }
        >
          🔍 +
        </button>

        <button
          type="button"
          onClick={() =>
            setZoom((value) =>
              Math.max(value - 0.1, 0.5)
            )
          }
        >
          🔍 -
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

        <button
          type="button"
          onClick={() =>
            setSelectedId(null)
          }
        >
          Clear Selection
        </button>

        {selectedFurniture && (
          <>
            <button
              type="button"
              onClick={rotateFurniture}
            >
              ↻ Rotate
            </button>

            <button
              type="button"
              onClick={() =>
                resizeFurniture(0.1)
              }
            >
              ＋ Size
            </button>

            <button
              type="button"
              onClick={() =>
                resizeFurniture(-0.1)
              }
            >
              － Size
            </button>

            <button
              type="button"
              onClick={deleteFurniture}
            >
              🗑 Delete
            </button>
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* MAIN EDITOR */}
      {/* ========================================= */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* ========================================= */}
        {/* CANVAS */}
        {/* ========================================= */}

        <div
          style={{
            border: "2px solid #333",
            overflow: "hidden",
          }}
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.target.getStage()
              ) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              {/* ROOM IMAGE */}

              {project.roomImage && (
                <RoomBackground
                  imageUrl={project.roomImage}
                  width={canvasWidth}
                  height={canvasHeight}
                />
              )}

              {!project.roomImage && (
                <>
                  <Rect
                    x={0}
                    y={0}
                    width={canvasWidth}
                    height={canvasHeight}
                  />

                  <Text
                    text="Upload a room image first"
                    x={280}
                    y={230}
                    fontSize={20}
                  />
                </>
              )}

              {/* GRID */}

              {showGrid &&
                createGrid(
                  canvasWidth,
                  canvasHeight
                )}

              {/* FURNITURE */}

              {project.furniture.map((item) => (
                <Text
                  key={item.id}
                  text={getFurnitureEmoji(
                    item.name
                  )}
                  x={item.x}
                  y={item.y}
                  fontSize={50}
                  rotation={item.rotation ?? 0}
                  scaleX={item.scale ?? 1}
                  scaleY={item.scale ?? 1}
                  draggable
                  onClick={() =>
                    setSelectedId(item.id)
                  }
                  onTap={() =>
                    setSelectedId(item.id)
                  }
                  onDragEnd={(event) => {
                    updateFurniture(
                      item.id,
                      {
                        x: event.target.x(),
                        y: event.target.y(),
                      }
                    );
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* ========================================= */}
        {/* PROPERTIES */}
        {/* ========================================= */}

        <div
          style={{
            width: "250px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h2>Properties</h2>

          {!selectedFurniture && (
            <p>
              Select furniture to edit it.
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

              <p>
                X:{" "}
                {Math.round(
                  selectedFurniture.x
                )}
              </p>

              <p>
                Y:{" "}
                {Math.round(
                  selectedFurniture.y
                )}
              </p>

              <p>
                Rotation:{" "}
                {Math.round(
                  selectedFurniture.rotation ?? 0
                )}
                °
              </p>

              <p>
                Scale:{" "}
                {(
                  selectedFurniture.scale ?? 1
                ).toFixed(1)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* PROJECT INFORMATION */}
      {/* ========================================= */}

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "10px",
        }}
      >
        <h2>Furniture in Project</h2>

        {project.furniture.length === 0 ? (
          <p>
            No furniture added yet.
          </p>
        ) : (
          project.furniture.map((item) => (
            <div key={item.id}>
              {getFurnitureEmoji(
                item.name
              )}{" "}
              {item.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------
// CREATE GRID
// ---------------------------------------------

function createGrid(
  width: number,
  height: number
) {
  const lines = [];

  const gridSize = 50;

  for (
    let x = 0;
    x <= width;
    x += gridSize
  ) {
    lines.push(
      <Line
        key={`vertical-${x}`}
        points={[x, 0, x, height]}
        stroke="#cccccc"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  for (
    let y = 0;
    y <= height;
    y += gridSize
  ) {
    lines.push(
      <Line
        key={`horizontal-${y}`}
        points={[0, y, width, y]}
        stroke="#cccccc"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return lines;
}

// ---------------------------------------------
// FURNITURE EMOJI
// ---------------------------------------------

function getFurnitureEmoji(name: string) {
  switch (name) {
    case "Sofa":
      return "🛋️";

    case "Coffee Table":
      return "🪑";

    case "TV Unit":
      return "📺";

    case "Chair":
      return "💺";

    case "Bed":
      return "🛏️";

    case "Wardrobe":
      return "🚪";

    case "Nightstand":
      return "🗄️";

    case "Rug":
      return "🟫";

    case "Lamp":
      return "💡";

    case "Plant":
      return "🪴";

    default:
      return "⬜";
  }
}

export default RoomEditor;
