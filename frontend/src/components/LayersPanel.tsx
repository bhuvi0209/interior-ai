import { useProject } from "../context/ProjectContext";

type LayersPanelProps = {
  selectedId: string | number | null;
  onSelect: (
    id: string | number
  ) => void;
};

export default function LayersPanel({
  selectedId,
  onSelect,
}: LayersPanelProps) {
  const {
    project,
    setProject,
  } = useProject();

  const toggleVisibility = (
    id: string | number
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  visible: !item.visible,
                }
              : item
        ),
    }));
  };

  const toggleLock = (
    id: string | number
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  locked: !item.locked,
                }
              : item
        ),
    }));
  };

  const deleteFurniture = (
    id: string | number
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.filter(
          (item) => item.id !== id
        ),
    }));
  };

  const moveLayerUp = (
    id: string | number
  ) => {
    setProject((currentProject) => {
      const index =
        currentProject.furniture.findIndex(
          (item) => item.id === id
        );

      if (
        index === -1 ||
        index ===
          currentProject.furniture.length - 1
      ) {
        return currentProject;
      }

      const furniture = [
        ...currentProject.furniture,
      ];

      const current =
        furniture[index];

      furniture[index] =
        furniture[index + 1];

      furniture[index + 1] =
        current;

      return {
        ...currentProject,
        furniture,
      };
    });
  };

  const moveLayerDown = (
    id: string | number
  ) => {
    setProject((currentProject) => {
      const index =
        currentProject.furniture.findIndex(
          (item) => item.id === id
        );

      if (index <= 0) {
        return currentProject;
      }

      const furniture = [
        ...currentProject.furniture,
      ];

      const current =
        furniture[index];

      furniture[index] =
        furniture[index - 1];

      furniture[index - 1] =
        current;

      return {
        ...currentProject,
        furniture,
      };
    });
  };

  return (
    <div
      style={{
        width: "260px",
        height: "100%",
        background: "#ffffff",
        borderRight:
          "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}

      <div
        style={{
          padding: "15px",
          borderBottom:
            "1px solid #ddd",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          Layers
        </h2>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: "12px",
            color: "#777",
          }}
        >
          {project.furniture.length} furniture item
          {project.furniture.length !== 1
            ? "s"
            : ""}
        </p>
      </div>

      {/* Layer List */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {project.furniture.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px 10px",
              color: "#888",
              fontSize: "14px",
            }}
          >
            No furniture added yet.
          </div>
        )}

        {[...project.furniture]
          .reverse()
          .map((item) => {
            const isSelected =
              selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() =>
                  onSelect(item.id)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px",
                  marginBottom: "5px",

                  background:
                    isSelected
                      ? "#e8f0ff"
                      : "#f8f8f8",

                  border:
                    isSelected
                      ? "1px solid #4a7cff"
                      : "1px solid #eee",

                  borderRadius: "6px",

                  cursor:
                    "pointer",

                  opacity:
                    item.visible
                      ? 1
                      : 0.5,
                }}
              >
                {/* Furniture Icon */}

                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: "20px",
                    background:
                      "#ffffff",
                    borderRadius: "5px",
                  }}
                >
                  {getFurnitureIcon(
                    item.name
                  )}
                </div>

                {/* Name */}

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                    }}
                  >
                    {item.category}
                  </div>
                </div>

                {/* Visibility */}

                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    toggleVisibility(
                      item.id
                    );
                  }}
                  title={
                    item.visible
                      ? "Hide"
                      : "Show"
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    padding: "3px",
                  }}
                >
                  {item.visible
                    ? "👁️"
                    : "🚫"}
                </button>

                {/* Lock */}

                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    toggleLock(
                      item.id
                    );
                  }}
                  title={
                    item.locked
                      ? "Unlock"
                      : "Lock"
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    padding: "3px",
                  }}
                >
                  {item.locked
                    ? "🔒"
                    : "🔓"}
                </button>

                {/* Delete */}

                <button
                  onClick={(event) => {
                    event.stopPropagation();

                    deleteFurniture(
                      item.id
                    );
                  }}
                  title="Delete"
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    padding: "3px",
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          })}
      </div>

      {/* Layer Ordering */}

      {selectedId !== null && (
        <div
          style={{
            borderTop:
              "1px solid #ddd",
            padding: "10px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Layer Order
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "6px",
            }}
          >
            <button
              onClick={() =>
                moveLayerUp(
                  selectedId
                )
              }
              style={{
                padding: "7px",
                cursor: "pointer",
              }}
            >
              ⬆️ Up
            </button>

            <button
              onClick={() =>
                moveLayerDown(
                  selectedId
                )
              }
              style={{
                padding: "7px",
                cursor: "pointer",
              }}
            >
              ⬇️ Down
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
  Returns an emoji based on
  the furniture name.
*/

function getFurnitureIcon(
  name: string
) {
  const lowerName =
    name.toLowerCase();

  if (
    lowerName.includes("sofa")
  ) {
    return "🛋️";
  }

  if (
    lowerName.includes("chair")
  ) {
    return "🪑";
  }

  if (
    lowerName.includes("table")
  ) {
    return "☕";
  }

  if (
    lowerName.includes("bed")
  ) {
    return "🛏️";
  }

  if (
    lowerName.includes("wardrobe")
  ) {
    return "🚪";
  }

  if (
    lowerName.includes("lamp")
  ) {
    return "💡";
  }

  if (
    lowerName.includes("plant")
  ) {
    return "🌱";
  }

  return "🪑";
}