import { useState } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

type FurnitureItem = {
  id: number;
  name: string;
  x: number;
  y: number;
};

function RoomEditor() {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const addFurniture = (name: string) => {
    const newFurniture: FurnitureItem = {
      id: Date.now(),
      name,
      x: 300,
      y: 200,
    };

    setFurniture([...furniture, newFurniture]);
  };

  const moveFurniture = (
    id: number,
    x: number,
    y: number
  ) => {
    setFurniture((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, x, y }
          : item
      )
    );
  };

  const deleteFurniture = () => {
    if (selectedId === null) {
      return;
    }

    setFurniture((items) =>
      items.filter((item) => item.id !== selectedId)
    );

    setSelectedId(null);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial",
      }}
    >
      {/* Furniture Sidebar */}

      <div
        style={{
          width: "220px",
          padding: "20px",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2>Furniture</h2>

        <button
          onClick={() => addFurniture("Sofa")}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          🛋️ Sofa
        </button>

        <button
          onClick={() => addFurniture("Chair")}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          🪑 Chair
        </button>

        <button
          onClick={() => addFurniture("Bed")}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          🛏️ Bed
        </button>

        <button
          onClick={() => addFurniture("Table")}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          🟫 Table
        </button>

        <button
          onClick={deleteFurniture}
          disabled={selectedId === null}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            marginTop: "30px",
          }}
        >
          Delete Selected
        </button>
      </div>

      {/* Room Canvas */}

      <div
        style={{
          flex: 1,
          padding: "20px",
          background: "#f5f5f5",
        }}
      >
        <h1>2D Room Editor</h1>

        <Stage
          width={800}
          height={550}
          style={{
            background: "white",
            border: "2px solid #333",
          }}
        >
          <Layer>
            {/* Room */}

            <Rect
              x={20}
              y={20}
              width={750}
              height={500}
              stroke="black"
              strokeWidth={3}
            />

            <Text
              x={40}
              y={40}
              text="Room"
              fontSize={20}
            />

            {/* Furniture */}

            {furniture.map((item) => (
              <Group
                key={item.id}
                x={item.x}
                y={item.y}
                draggable
                onClick={() =>
                  setSelectedId(item.id)
                }
                onDragEnd={(event) => {
                  moveFurniture(
                    item.id,
                    event.target.x(),
                    event.target.y()
                  );
                }}
              >
                <Rect
                  width={120}
                  height={70}
                  fill={
                    selectedId === item.id
                      ? "lightblue"
                      : "lightgray"
                  }
                  stroke="black"
                />

                <Text
                  text={item.name}
                  width={120}
                  height={70}
                  align="center"
                  verticalAlign="middle"
                  fontSize={16}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default RoomEditor;