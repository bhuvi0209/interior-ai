import { useProject } from "../context/ProjectContext";
import {
  MIN_SCALE,
  MAX_SCALE,
} from "../constants/editor";

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

  // --------------------------------
  // Update furniture
  // --------------------------------

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

  // --------------------------------
  // Change scale
  // --------------------------------

  const changeScale = (
    amount: number
  ) => {
    const currentScale =
      furniture.scale ?? 1;

    const newScale =
      currentScale + amount;

    const limitedScale =
      Math.max(
        MIN_SCALE,
        Math.min(
          MAX_SCALE,
          newScale
        )
      );

    updateFurniture({
      scale: limitedScale,
    });
  };

  // --------------------------------
  // Rotate furniture
  // --------------------------------

  const rotateFurniture = (
    amount: number
  ) => {
    const currentRotation =
      furniture.rotation ?? 0;

    const newRotation =
      (currentRotation + amount + 360) %
      360;

    updateFurniture({
      rotation: newRotation,
    });
  };

  // --------------------------------
  // Delete furniture
  // --------------------------------

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

  // --------------------------------
  // Current values
  // --------------------------------

  const currentScale =
    furniture.scale ?? 1;

  const currentRotation =
    furniture.rotation ?? 0;

  // --------------------------------
  // UI
  // --------------------------------

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

      {/* X POSITION */}

      <label>
        X Position
      </label>

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
        style={{
          width: "100%",
          marginBottom: "12px",
        }}
      />

      {/* Y POSITION */}

      <label>
        Y Position
      </label>

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
        style={{
          width: "100%",
          marginBottom: "12px",
        }}
      />

      {/* ROTATION */}

      <label>
        Rotation: {currentRotation}°
      </label>

      <input
        type="number"
        min="0"
        max="360"
        value={currentRotation}
        onChange={(event) =>
          updateFurniture({
            rotation: Number(
              event.target.value
            ),
          })
        }
        style={{
          width: "100%",
          marginBottom: "10px",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <button
          onClick={() =>
            rotateFurniture(-15)
          }
        >
          ↺ 15°
        </button>

        <button
          onClick={() =>
            rotateFurniture(15)
          }
        >
          ↻ 15°
        </button>
      </div>

      <button
        onClick={() =>
          updateFurniture({
            rotation: 0,
          })
        }
        style={{
          marginBottom: "15px",
        }}
      >
        Reset Rotation
      </button>

      {/* SCALE */}

      <label>
        Scale: {currentScale.toFixed(1)}
      </label>

      <input
        type="number"
        step="0.1"
        min={MIN_SCALE}
        max={MAX_SCALE}
        value={currentScale}
        onChange={(event) =>
          updateFurniture({
            scale: Number(
              event.target.value
            ),
          })
        }
        style={{
          width: "100%",
          marginBottom: "10px",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() =>
            changeScale(-0.1)
          }
        >
          −
        </button>

        <span>
          {currentScale.toFixed(1)}
        </span>

        <button
          onClick={() =>
            changeScale(0.1)
          }
        >
          +
        </button>
      </div>

      {/* DELETE */}

      <button
        onClick={deleteFurniture}
        style={{
          width: "100%",
          padding: "10px",
          background: "#e53935",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Delete Furniture
      </button>

      {/* CLOSE */}

      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );
}