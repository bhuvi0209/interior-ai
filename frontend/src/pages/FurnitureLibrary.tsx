import { useState } from "react";
import { useProject } from "../context/ProjectContext";

type ProjectFurniture = {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
};

const furnitureItems: Furniture[] = [
  {
    id: 1,
    name: "Sofa",
    category: "Living Room",
    emoji: "🛋️",
  },
  {
    id: 2,
    name: "Coffee Table",
    category: "Living Room",
    emoji: "🪑",
  },
  {
    id: 3,
    name: "TV Unit",
    category: "Living Room",
    emoji: "📺",
  },
  {
    id: 4,
    name: "Chair",
    category: "Living Room",
    emoji: "💺",
  },
  {
    id: 5,
    name: "Bed",
    category: "Bedroom",
    emoji: "🛏️",
  },
  {
    id: 6,
    name: "Wardrobe",
    category: "Bedroom",
    emoji: "🚪",
  },
  {
    id: 7,
    name: "Nightstand",
    category: "Bedroom",
    emoji: "🗄️",
  },
  {
    id: 8,
    name: "Rug",
    category: "Decor",
    emoji: "🟫",
  },
  {
    id: 9,
    name: "Lamp",
    category: "Decor",
    emoji: "💡",
  },
  {
    id: 10,
    name: "Plant",
    category: "Decor",
    emoji: "🪴",
  },
];

function FurnitureLibrary() {
  const [selectedFurniture, setSelectedFurniture] =
    useState<Furniture | null>(null);

  const { project, setProject } = useProject();

  const categories = [
    "Living Room",
    "Bedroom",
    "Decor",
  ];

  const addFurnitureToProject = (
    furniture: Furniture
  ) => {
    const newFurniture = {
      id: Date.now(),
      name: furniture.name,
      x: 100 + (project.furniture.length % 5) * 120,
      y: 100 + Math.floor(project.furniture.length / 5) * 120,
    };

    setProject({
      ...project,
      furniture: [
        ...project.furniture,
        newFurniture,
      ],
    });

    setSelectedFurniture(furniture);
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>Furniture Library</h1>

      <p>
        Choose furniture for your interior design.
      </p>

      {categories.map((category) => {
        const categoryItems =
          furnitureItems.filter(
            (item) => item.category === category
          );

        return (
          <div
            key={category}
            style={{ marginTop: "40px" }}
          >
            <h2>{category}</h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    addFurnitureToProject(item)
                  }
                  style={{
                    width: "180px",
                    padding: "25px",
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "45px",
                      marginBottom: "10px",
                    }}
                  >
                    {item.emoji}
                  </div>

                  <strong>{item.name}</strong>

                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                    }}
                  >
                    Add to Project
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {selectedFurniture && (
        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>Added Furniture</h2>

          <p>
            {selectedFurniture.emoji}{" "}
            {selectedFurniture.name}
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "10px",
        }}
      >
        <h2>Project Furniture</h2>

        {project.furniture.length === 0 ? (
          <p>No furniture added yet.</p>
        ) : (
          project.furniture.map((item) => (
            <p key={item.id}>
              {item.name} — X: {item.x}, Y: {item.y}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

export default FurnitureLibrary;