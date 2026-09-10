import { useProject } from "../context/ProjectContext";

type Props = {
  selectedId: string | number | null;
  onClose: () => void;
};

export default function FurnitureProperties({
  selectedId,
  onClose,
}: Props) {
  const { project, setProject } = useProject();

  const furniture = project.furniture.find(
    (item) => item.id === selectedId
  );

  if (!furniture) {
    return null;
  }

  const updateFurniture = (
    changes: Partial<typeof furniture>
  ) => {
    setProject((currentProject) => ({
      ...currentProject,
      furniture: currentProject.furniture.map((item) =>
        item.id === selectedId
          ? { ...item, ...changes }
          : item
      ),
    }));
  };

  const duplicateFurniture = () => {
    const newFurniture = {
      ...furniture,
      id: Date.now(),
      x: furniture.x + 40,
      y: furniture.y + 40,
    };

    setProject((currentProject) => ({
      ...currentProject,
      furniture: [
        ...currentProject.furniture,
        newFurniture,
      ],
    }));
  };

  const deleteFurniture = () => {
    setProject((currentProject) => ({
      ...currentProject,
      furniture: currentProject.furniture.filter(
        (item) => item.id !== selectedId
      ),
    }));

    onClose();
  };

  return (
    <div
      style={{
        width: "280px",
        padding: "20px",
        background: "#ffffff",
        borderLeft: "1px solid #ddd",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Furniture Properties
        </h2>

        <button
          type="button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <h3>{furniture.name}</h3>

      <p
        style={{
          color: "#666",
          fontSize: "14px",
        }}
      >
        Category: {furniture.category}
      </p>

      <label>X Position</label>

      <input
        type="number"
        value={Math.round(furniture.x)}
        onChange={(event) =>
          updateFurniture({
            x: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Y Position</label>

      <input
        type="number"
        value={Math.round(furniture.y)}
        onChange={(event) =>
          updateFurniture({
            y: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Rotation</label>

      <input
        type="number"
        value={Math.round(furniture.rotation ?? 0)}
        onChange={(event) =>
          updateFurniture({
            rotation: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Scale</label>

      <input
        type="number"
        step="0.1"
        min="0.5"
        max="2.5"
        value={furniture.scale ?? 1}
        onChange={(event) =>
          updateFurniture({
            scale: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Width</label>

      <input
        type="number"
        value={furniture.width ?? ""}
        onChange={(event) =>
          updateFurniture({
            width: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Depth</label>

      <input
        type="number"
        value={furniture.depth ?? ""}
        onChange={(event) =>
          updateFurniture({
            depth: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "15px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <label>Height</label>

      <input
        type="number"
        value={furniture.height ?? ""}
        onChange={(event) =>
          updateFurniture({
            height: Number(event.target.value),
          })
        }
        style={{
          width: "100%",
          marginTop: "5px",
          marginBottom: "20px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      />

      <button
        type="button"
        onClick={duplicateFurniture}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          cursor: "pointer",
        }}
      >
        📋 Duplicate
      </button>

      <button
        type="button"
        onClick={deleteFurniture}
        style={{
          width: "100%",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        🗑️ Delete Furniture
      </button>
    </div>
  );
}