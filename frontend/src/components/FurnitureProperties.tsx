import { useProject } from "../context/ProjectContext";

type Props = {
  selectedId: string | number | null;
  onClose: () => void;
};

export default function FurnitureProperties({
  selectedId,
  onClose,
}: Props) {
  const {
    project,
    setProject,
  } = useProject();

  const furniture =
    project.furniture.find(
      (item) =>
        item.id === selectedId
    );

  if (!furniture) {
    return null;
  }

  const updateFurniture = (
    changes: Partial<typeof furniture>
  ) => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === selectedId
              ? {
                  ...item,
                  ...changes,
                }
              : item
        ),
    }));
  };

  const deleteFurniture = () => {
    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.filter(
          (item) =>
            item.id !== selectedId
        ),
    }));

    onClose();
  };

  return (
    <div
      style={{
        padding: "20px",
        width: "260px",
        background: "#ffffff",
        borderLeft:
          "1px solid #ddd",
      }}
    >
      <h2>{furniture.name}</h2>

      <label>X Position</label>

      <input
        type="number"
        value={furniture.x}
        onChange={(event) =>
          updateFurniture({
            x: Number(
              event.target.value
            ),
          })
        }
      />

      <label>Y Position</label>

      <input
        type="number"
        value={furniture.y}
        onChange={(event) =>
          updateFurniture({
            y: Number(
              event.target.value
            ),
          })
        }
      />

      <label>Rotation</label>

      <input
        type="number"
        value={furniture.rotation}
        onChange={(event) =>
          updateFurniture({
            rotation: Number(
              event.target.value
            ),
          })
        }
      />

      <label>Scale</label>

      <input
        type="number"
        step="0.1"
        min="0.1"
        value={furniture.scale}
        onChange={(event) =>
          updateFurniture({
            scale: Number(
              event.target.value
            ),
          })
        }
      />

      <button
        onClick={deleteFurniture}
      >
        Delete Furniture
      </button>

      <button
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
