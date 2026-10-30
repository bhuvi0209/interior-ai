
import { useMemo, useState } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureArrangementOptimizerProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
  onApplyPosition: (
    itemId: string | number,
    x: number,
    y: number
  ) => void;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface PositionSuggestion {
  item: FurnitureItem;
  x: number;
  y: number;
  message: string;
}

function getBounds(
  item: FurnitureItem,
  x = item.x,
  y = item.y
): Bounds | null {
  const width = Number(item.width);
  const depth = Number(item.depth);
  const scale = Number(item.scale);
  const rotation = Number(item.rotation);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(depth) ||
    !Number.isFinite(scale) ||
    !Number.isFinite(rotation) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    width <= 0 ||
    depth <= 0 ||
    scale <= 0
  ) {
    return null;
  }

  const radians = (rotation * Math.PI) / 180;
  const scaledWidth = width * scale;
  const scaledDepth = depth * scale;

  const rotatedWidth =
    Math.abs(scaledWidth * Math.cos(radians)) +
    Math.abs(scaledDepth * Math.sin(radians));

  const rotatedDepth =
    Math.abs(scaledWidth * Math.sin(radians)) +
    Math.abs(scaledDepth * Math.cos(radians));

  return {
    left: x - rotatedWidth / 2,
    right: x + rotatedWidth / 2,
    top: y - rotatedDepth / 2,
    bottom: y + rotatedDepth / 2,
  };
}

function overlaps(a: Bounds, b: Bounds): boolean {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function FurnitureArrangementOptimizer({
  currentRoom,
  furniture,
  onApplyPosition,
}: FurnitureArrangementOptimizerProps) {
  const [appliedId, setAppliedId] = useState<string | number | null>(
    null
  );

  const result = useMemo(() => {
    const roomWidth = Number(currentRoom.width);
    const roomDepth = Number(currentRoom.depth);

    if (
      !Number.isFinite(roomWidth) ||
      !Number.isFinite(roomDepth) ||
      roomWidth <= 0 ||
      roomDepth <= 0
    ) {
      return {
        suggestions: [] as PositionSuggestion[],
        invalidRoom: true,
        invalidItems: [] as FurnitureItem[],
        collisionCount: 0,
      };
    }

    const visible = furniture.filter((item) => item.visible);
    const boundsById = new Map<string | number, Bounds>();
    const invalidItems: FurnitureItem[] = [];

    for (const item of visible) {
      const bounds = getBounds(item);

      if (bounds) {
        boundsById.set(item.id, bounds);
      } else {
        invalidItems.push(item);
      }
    }

    const collidingIds = new Set<string | number>();
    let collisionCount = 0;

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const first = boundsById.get(visible[i].id);
        const second = boundsById.get(visible[j].id);

        if (first && second && overlaps(first, second)) {
          collidingIds.add(visible[i].id);
          collidingIds.add(visible[j].id);
          collisionCount++;
        }
      }
    }

    const suggestions: PositionSuggestion[] = [];

    // Try moving each colliding item in eight directions.
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },
    ];

    const step = Math.max(
      10,
      Math.min(roomWidth, roomDepth) * 0.05
    );

    for (const item of visible) {
      if (!collidingIds.has(item.id)) {
        continue;
      }

      const originalBounds = boundsById.get(item.id);

      if (!originalBounds) {
        continue;
      }

      let best: PositionSuggestion | null = null;
      let bestDistance = Infinity;

      // Search progressively farther away from the current position.
      for (let distance = 1; distance <= 12; distance++) {
        for (const direction of directions) {
          const candidateX = item.x + direction.x * step * distance;
          const candidateY = item.y + direction.y * step * distance;
          const candidateBounds = getBounds(item, candidateX, candidateY);

          if (!candidateBounds) {
            continue;
          }

          const insideRoom =
            candidateBounds.left >= -roomWidth / 2 &&
            candidateBounds.right <= roomWidth / 2 &&
            candidateBounds.top >= -roomDepth / 2 &&
            candidateBounds.bottom <= roomDepth / 2;

          if (!insideRoom) {
            continue;
          }

          const hitsAnotherItem = visible.some((other) => {
            if (other.id === item.id) {
              return false;
            }

            const otherBounds = boundsById.get(other.id);

            return (
              otherBounds !== undefined &&
              overlaps(candidateBounds, otherBounds)
            );
          });

          if (hitsAnotherItem) {
            continue;
          }

          const movedDistance = Math.hypot(
            candidateX - item.x,
            candidateY - item.y
          );

          if (movedDistance < bestDistance) {
            bestDistance = movedDistance;
            best = {
              item,
              x: candidateX,
              y: candidateY,
              message: `Move approximately ${movedDistance.toFixed(
                1
              )} units to a nearby clear position.`,
            };
          }
        }

        // The first distance with a valid solution is the nearest step.
        if (best) {
          break;
        }
      }

      if (best) {
        suggestions.push(best);
      }
    }

    return {
      suggestions,
      invalidRoom: false,
      invalidItems,
      collisionCount,
    };
  }, [currentRoom, furniture]);

  return (
    <section
      style={{
        margin: "20px 0",
        padding: 20,
        border: "1px solid #d1d5db",
        borderRadius: 12,
        background: "#ffffff",
        color: "#1f2937",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>
        Furniture Arrangement Optimizer
      </h2>

      <p
        style={{
          margin: "0 0 18px",
          color: "#6b7280",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Finds nearby positions that may resolve overlapping furniture
        while keeping items inside the room.
      </p>

      {result.invalidRoom ? (
        <p style={{ color: "#b91c1c", fontSize: 14 }}>
          Please enter valid room width and depth before optimizing.
        </p>
      ) : result.invalidItems.length > 0 ? (
        <div
          style={{
            padding: 12,
            marginBottom: 14,
            borderRadius: 8,
            background: "#fff7ed",
            color: "#9a3412",
            fontSize: 14,
          }}
        >
          {result.invalidItems.length} item(s) have missing or invalid
          dimensions, so they cannot be checked accurately.
        </div>
      ) : null}

      <div
        style={{
          padding: 14,
          borderRadius: 8,
          background:
            result.collisionCount > 0 ? "#fef2f2" : "#f0fdf4",
          marginBottom: 18,
        }}
      >
        <strong
          style={{
            color: result.collisionCount > 0 ? "#b91c1c" : "#15803d",
          }}
        >
          {result.collisionCount > 0
            ? `${result.collisionCount} potential collision(s) detected`
            : "No potential collisions detected"}
        </strong>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "#4b5563",
          }}
        >
          {result.suggestions.length} item(s) have a suggested alternative
          position.
        </p>
      </div>

      <h3 style={{ fontSize: 16, margin: "0 0 12px" }}>
        Suggested improvements
      </h3>

      {result.suggestions.length === 0 ? (
        <p
          style={{
            padding: 14,
            background: "#f9fafb",
            borderRadius: 8,
            fontSize: 14,
            color: "#4b5563",
          }}
        >
          {result.collisionCount === 0
            ? "Your current furniture layout has no detected overlaps, or no adjustment is needed."
            : "No suitable nearby positions were found. Try resizing the furniture or increasing the room dimensions."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {result.suggestions.map((suggestion) => (
            <div
              key={suggestion.item.id}
              style={{
                padding: 14,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            >
              <strong>
                {suggestion.item.name || "Unnamed furniture"}
              </strong>

              <p
                style={{
                  margin: "8px 0",
                  fontSize: 14,
                  color: "#4b5563",
                }}
              >
                {suggestion.message}
              </p>

              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Suggested position: X = {suggestion.x.toFixed(1)}, Y ={" "}
                {suggestion.y.toFixed(1)}
              </p>

              <button
                type="button"
                onClick={() => {
                  onApplyPosition(
                    suggestion.item.id,
                    suggestion.x,
                    suggestion.y
                  );
                  setAppliedId(suggestion.item.id);
                }}
                style={{
                  padding: "9px 14px",
                  border: "none",
                  borderRadius: 6,
                  background: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Apply suggested position
              </button>

              {appliedId === suggestion.item.id && (
                <p
                  role="status"
                  style={{
                    margin: "8px 0 0",
                    color: "#15803d",
                    fontSize: 13,
                  }}
                >
                  Position update requested.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          margin: "18px 0 0",
          fontSize: 12,
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        This is a basic optimizer using rotated rectangular bounding
        boxes. It assumes the room is centered at (0, 0) and furniture
        positions use the same units as room dimensions. Always review
        the resulting layout in your 3D editor.
      </p>
    </section>
  );
}

export default FurnitureArrangementOptimizer;
