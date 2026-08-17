import { useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Rect,
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

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const canvasWidth = 800;
  const canvasHeight = 500;

  useEffect(() => {
    console.log("Current project:", project);
  }, [project]);

  const handleDragEnd = (
    id: number,
    x: number,
    y: number
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture: currentProject.furniture.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                x,
                y,
              }
            : item
      ),
    }));
  };

  return (
    <div
      style={{
        padding: "30px",
      }}
    >
      <h1>2D Room Editor</h1>

      <p>
        Drag furniture around the room to create
        your layout.
      </p>

      {!project.roomImage && (
        <div
          style={{
            padding: "20px",
            background: "#fff3cd",
            marginBottom: "20px",
          }}
        >
          Please upload a room image first.
        </div>
      )}

      <div
        style={{
          border: "2px solid #333",
          width: canvasWidth,
          maxWidth: "100%",
        }}
      >
        <Stage
          width={canvasWidth}
          height={canvasHeight}
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
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill="#eeeeee"
              />
            )}

            {!project.roomImage && (
              <Text
                text="Upload a room image first"
                x={280}
                y={230}
                fontSize={20}
              />
            )}

            {project.furniture.map((item) => (
              <Text
                key={item.id}
                text={getFurnitureEmoji(item.name)}
                x={item.x}
                y={item.y}
                fontSize={50}
                draggable
                onClick={() =>
                  setSelectedId(item.id)
                }
                onTap={() =>
                  setSelectedId(item.id)
                }
                onDragEnd={(event) => {
                  handleDragEnd(
                    item.id,
                    event.target.x(),
                    event.target.y()
                  );
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <div
        style={{
          marginTop: "25px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "10px",
        }}
      >
        <h2>Furniture</h2>

        {project.furniture.length === 0 ? (
          <p>
            No furniture added. Go to the Furniture
            Library and add some items.
          </p>
        ) : (
          project.furniture.map((item) => (
            <div key={item.id}>
              {getFurnitureEmoji(item.name)}{" "}
              {item.name}

              {" — X: "}
              {Math.round(item.x)}

              {" Y: "}
              {Math.round(item.y)}

              {selectedId === item.id && (
                <strong> ← Selected</strong>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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