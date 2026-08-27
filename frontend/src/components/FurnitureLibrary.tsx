import { useState } from "react";
import { furnitureLibrary } from "../data/furnitureData";

type FurnitureLibraryProps = {
  onAddFurniture: (furnitureId: string) => void;
};

export default function FurnitureLibrary({
  onAddFurniture,
}: FurnitureLibraryProps) {
  const [search, setSearch] = useState("");

  const categories = [
    "Living Room",
    "Bedroom",
    "Decor",
  ];

  return (
    <div
      style={{
        width: "220px",
        flexShrink: 0,
        padding: "15px",
        background: "#f5f5f5",
        borderRadius: "12px",
        border: "1px solid #ddd",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: "center",
        }}
      >
        Furniture Library
      </h2>

      <input
        type="text"
        placeholder="Search furniture..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
        }}
      />

      {categories.map((category) => (
        <div key={category}>
          <h3>{category}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {furnitureLibrary
              .filter(
                (item) =>
                  item.category === category
              )
              .filter((item) =>
                item.name
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((item) => (
                <button
                  key={item.id}
                  draggable
                  onClick={() =>
                    onAddFurniture(item.id)
                  }
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "furnitureId",
                      item.id
                    );

                    event.dataTransfer.effectAllowed =
                      "copy";
                  }}
                  style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      background: "white",
                      cursor: "grab",
                    }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      marginBottom: "5px",
                    }}
                  >
                    {getFurnitureEmoji(item.name)}
                  </div>

                  <div>{item.name}</div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------
// FURNITURE EMOJI
// ---------------------------------------------

function getFurnitureEmoji(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("sofa")) {
    return "🛋️";
  }

  if (lowerName.includes("chair")) {
    return "🪑";
  }

  if (lowerName.includes("table")) {
    return "☕";
  }

  if (lowerName.includes("bed")) {
    return "🛏️";
  }

  if (lowerName.includes("wardrobe")) {
    return "🚪";
  }

  if (lowerName.includes("lamp")) {
    return "💡";
  }

  if (lowerName.includes("plant")) {
    return "🪴";
  }

  if (lowerName.includes("rug")) {
    return "🟫";
  }

  if (lowerName.includes("tv")) {
    return "📺";
  }

  return "🪑";
}