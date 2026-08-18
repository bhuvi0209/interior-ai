import { useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Rect,
  Transformer,
} from "react-konva";

import useImage from "use-image";

import { useProject } from "../context/ProjectContext";

type FurnitureObjectProps = {
  id: number;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
};

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

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const canvasWidth = 800;
  const canvasHeight = 500;

  const selectedFurniture =
    project.furniture.find(
      (item) => item.id === selectedId
    );

  const updateFurniture = (
    id: number,
    changes: Partial<FurnitureObjectProps>
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

  const deleteFurniture = () => {
    if (selectedId === null) {
      return;
    }

    setProject((currentProject) => ({
      ...currentProject,

      furniture: currentProject.furniture.filter(
        (item) => item.id !== selectedId
      ),
    }));

    setSelectedId(null);
  };

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

  const resizeFurniture = (amount: number) => {
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

  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      <h1>2D Room Editor</h1>

      <p>
        Select and arrange your furniture.
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* CANVAS */}

        <div
          style={{
            border: "2px solid #333",
          }}
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={(event) => {
              if (
                event.target === event.target.getStage()
              ) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
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
                    fill="#eeeeee"
                  />

                  <Text
                    text="Upload a room image first"
                    x={280}
                    y={230}
                    fontSize={20}
                  />
                </>
              )}

              {project.furniture.map((item) => (
                <Text
                  key={item.id}
                  text={getFurnitureEmoji(item.name)}
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
                    updateFurniture(item.id, {
                      x: event.target.x(),
                      y: event.target.y(),
                    });
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* PROPERTIES PANEL */}

        <div
          style={{
            width: "250px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            background: "#fafafa",
          }}
        >
          <h2>Properties</h2>

          {!selectedFurniture && (
            <p>
              Select a furniture item to edit it.
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

              <hr />

              <p>
                <strong>X:</strong>{" "}
                {Math.round(selectedFurniture.x)}
              </p>

              <p>
                <strong>Y:</strong>{" "}
                {Math.round(selectedFurniture.y)}
              </p>

              <p>
                <strong>Rotation:</strong>{" "}
                {Math.round(
                  selectedFurniture.rotation ?? 0
                )}
                °
              </p>

              <p>
                <strong>Scale:</strong>{" "}
                {(selectedFurniture.scale ?? 1).toFixed(
                  1
                )}
              </p>

              <hr />

              <button
                onClick={rotateFurniture}
                style={buttonStyle}
              >
                Rotate 15°
              </button>

              <button
                onClick={() => resizeFurniture(0.1)}
                style={buttonStyle}
              >
                Increase Size
              </button>

              <button
                onClick={() => resizeFurniture(-0.1)}
                style={buttonStyle}
              >
                Decrease Size
              </button>

              <button
                onClick={deleteFurniture}
                style={{
                  ...buttonStyle,
                  marginTop: "20px",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  cursor: "pointer",
};

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