import type { FurnitureItem } from "../types/Project";
import { useProject } from "../context/ProjectContext";

interface FurniturePropertiesProps {
  selectedId: string | number | null;
  onClose: () => void;
}

export default function FurnitureProperties({
  selectedId,
  onClose,
}: FurniturePropertiesProps) {
  const { project, setProject } = useProject();

  const furniture = project.furniture.find(
    (item) => item.id === selectedId
  );

  if (!furniture) {
    return null;
  }

  const updateFurniture = (
    updates: Partial<FurnitureItem>
  ) => {
    setProject((current) => ({
      ...current,
      furniture: current.furniture.map((item) =>
        item.id === furniture.id
          ? {
              ...item,
              ...updates,
            }
          : item
      ),
    }));
  };

  const updateNumber = (
    field:
      | "x"
      | "y"
      | "rotation"
      | "scale"
      | "width"
      | "depth"
      | "height",
    value: string
  ) => {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return;
    }

    updateFurniture({
      [field]: numberValue,
    });
  };

  const handleDelete = () => {
    setProject((current) => ({
      ...current,
      furniture: current.furniture.filter(
        (item) => item.id !== furniture.id
      ),
    }));

    onClose();
  };

  const handleDuplicate = () => {
    const duplicate: FurnitureItem = {
      ...furniture,
      id: `${furniture.id}-copy-${Date.now()}`,
      x: furniture.x + 40,
      y: furniture.y + 40,
      locked: false,
      visible: true,
    };

    setProject((current) => ({
      ...current,
      furniture: [...current.furniture, duplicate],
    }));
  };

  const handleToggleLock = () => {
    updateFurniture({
      locked: !furniture.locked,
    });
  };

  const handleToggleVisibility = () => {
    const newVisible = !furniture.visible;

    updateFurniture({
      visible: newVisible,
    });

    if (!newVisible) {
      onClose();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          Furniture Properties
        </h3>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            fontSize: "18px",
            cursor: "pointer",
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* NAME */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "6px",
          }}
        >
          Name
        </label>

        <input
          type="text"
          value={furniture.name}
          onChange={(event) =>
            updateFurniture({
              name: event.target.value,
            })
          }
          disabled={furniture.locked}
          style={{
            width: "100%",
            padding: "8px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* CATEGORY */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "6px",
          }}
        >
          Category
        </label>

        <input
          type="text"
          value={furniture.category}
          onChange={(event) =>
            updateFurniture({
              category: event.target.value,
            })
          }
          disabled={furniture.locked}
          style={{
            width: "100%",
            padding: "8px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* POSITION */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
          }}
        >
          Position
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {/* X */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              X
            </label>

            <input
              type="number"
              value={furniture.x}
              onChange={(event) =>
                updateNumber("x", event.target.value)
              }
              disabled={furniture.locked}
              style={{
                width: "100%",
                padding: "7px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Y */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Y
            </label>

            <input
              type="number"
              value={furniture.y}
              onChange={(event) =>
                updateNumber("y", event.target.value)
              }
              disabled={furniture.locked}
              style={{
                width: "100%",
                padding: "7px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* ROTATION */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
          }}
        >
          Rotation
        </h4>

        <label
          style={{
            display: "block",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          Degrees
        </label>

        <input
          type="number"
          value={furniture.rotation}
          onChange={(event) =>
            updateNumber("rotation", event.target.value)
          }
          disabled={furniture.locked}
          style={{
            width: "100%",
            padding: "7px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* SCALE */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
          }}
        >
          Scale
        </h4>

        <input
          type="number"
          min="0.1"
          step="0.1"
          value={furniture.scale}
          onChange={(event) =>
            updateNumber("scale", event.target.value)
          }
          disabled={furniture.locked}
          style={{
            width: "100%",
            padding: "7px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* DIMENSIONS */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
          }}
        >
          Dimensions
        </h4>

        {/* WIDTH */}
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Width
          </label>

          <input
            type="number"
            min="1"
            value={furniture.width ?? 100}
            onChange={(event) =>
              updateNumber("width", event.target.value)
            }
            disabled={furniture.locked}
            style={{
              width: "100%",
              padding: "7px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* DEPTH */}
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Depth
          </label>

          <input
            type="number"
            min="1"
            value={furniture.depth ?? 100}
            onChange={(event) =>
              updateNumber("depth", event.target.value)
            }
            disabled={furniture.locked}
            style={{
              width: "100%",
              padding: "7px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* HEIGHT */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Height
          </label>

          <input
            type="number"
            min="1"
            value={furniture.height ?? 100}
            onChange={(event) =>
              updateNumber("height", event.target.value)
            }
            disabled={furniture.locked}
            style={{
              width: "100%",
              padding: "7px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* STATUS */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 10px",
            fontSize: "14px",
          }}
        >
          Status
        </h4>

        <div
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
          }}
        >
          <div>
            Locked: {furniture.locked ? "Yes" : "No"}
          </div>

          <div>
            Visible: {furniture.visible ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "16px",
        }}
      >
        <h4
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
          }}
        >
          Actions
        </h4>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={handleToggleLock}
            style={{
              padding: "9px",
              cursor: "pointer",
            }}
          >
            {furniture.locked
              ? "Unlock Furniture"
              : "Lock Furniture"}
          </button>

          <button
            onClick={handleToggleVisibility}
            style={{
              padding: "9px",
              cursor: "pointer",
            }}
          >
            {furniture.visible
              ? "Hide Furniture"
              : "Show Furniture"}
          </button>

          <button
            onClick={handleDuplicate}
            style={{
              padding: "9px",
              cursor: "pointer",
            }}
          >
            Duplicate Furniture
          </button>

          <button
            onClick={handleDelete}
            style={{
              padding: "9px",
              cursor: "pointer",
              color: "#b00020",
            }}
          >
            Delete Furniture
          </button>
        </div>
      </div>
    </div>
  );
}