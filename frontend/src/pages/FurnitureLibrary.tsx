import { useState } from "react";

type Furniture = {
  id: number;
  name: string;
  category: string;
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

  const categories = [
    "Living Room",
    "Bedroom",
    "Decor",
  ];

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
        const categoryItems = furnitureItems.filter(
          (item) => item.category === category
        );

        return (
          <div key={category} style={{ marginTop: "40px" }}>
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
                    setSelectedFurniture(item)
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
          <h2>Selected Furniture</h2>

          <p>
            {selectedFurniture.emoji}{" "}
            {selectedFurniture.name}
          </p>

          <p>
            Category: {selectedFurniture.category}
          </p>
        </div>
      )}
    </div>
  );
}

export default FurnitureLibrary;