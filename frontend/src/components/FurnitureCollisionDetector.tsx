
import { useMemo } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureCollisionDetectorProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
}

interface FurnitureBounds {
  item: FurnitureItem;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  depth: number;
}

interface FurnitureCollision {
  first: FurnitureItem;
  second: FurnitureItem;
  overlapWidth: number;
  overlapDepth: number;
}

function FurnitureCollisionDetector({
  currentRoom,
  furniture,
}: FurnitureCollisionDetectorProps) {
  const result = useMemo(() => {
    const visibleFurniture = furniture.filter((item) => item.visible);

    const validBounds: FurnitureBounds[] = [];
    const missingDimensions: FurnitureItem[] = [];

    for (const item of visibleFurniture) {
      const width = Number(item.width);
      const depth = Number(item.depth);
      const scale = Number(item.scale);
      const x = Number(item.x);
      const y = Number(item.y);
      const rotation = Number(item.rotation);

      const valid =
        Number.isFinite(width) &&
        Number.isFinite(depth) &&
        Number.isFinite(scale) &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(rotation) &&
        width > 0 &&
        depth > 0 &&
        scale > 0;

      if (!valid) {
        missingDimensions.push(item);
        continue;
      }

      const scaledWidth = width * scale;
      const scaledDepth = depth * scale;
      const radians = (rotation * Math.PI) / 180;

      // Calculate the rotated bounding box.
      const boundingWidth =
        Math.abs(scaledWidth * Math.cos(radians)) +
        Math.abs(scaledDepth * Math.sin(radians));

      const boundingDepth =
        Math.abs(scaledWidth * Math.sin(radians)) +
        Math.abs(scaledDepth * Math.cos(radians));

      validBounds.push({
        item,
        left: x - boundingWidth / 2,
        right: x + boundingWidth / 2,
        top: y - boundingDepth / 2,
        bottom: y + boundingDepth / 2,
        width: boundingWidth,
        depth: boundingDepth,
      });
    }

    const collisions: FurnitureCollision[] = [];

    // Compare every pair of furniture items.
    for (let i = 0; i < validBounds.length; i++) {
      for (let j = i + 1; j < validBounds.length; j++) {
        const first = validBounds[i];
        const second = validBounds[j];

        const overlapWidth =
          Math.min(first.right, second.right) -
          Math.max(first.left, second.left);

        const overlapDepth =
          Math.min(first.bottom, second.bottom) -
          Math.max(first.top, second.top);

        // A positive overlap in both directions indicates a collision.
        if (overlapWidth > 0 && overlapDepth > 0) {
          collisions.push({
            first: first.item,
            second: second.item,
            overlapWidth,
            overlapDepth,
          });
        }
      }
    }

    const roomWidth = Number(currentRoom.width);
    const roomDepth = Number(currentRoom.depth);

    const roomIsValid =
      Number.isFinite(roomWidth) &&
      Number.isFinite(roomDepth) &&
      roomWidth > 0 &&
      roomDepth > 0;

    const outsideFurniture = roomIsValid
      ? validBounds.filter(
          (item) =>
            item.left < -roomWidth / 2 ||
            item.right > roomWidth / 2 ||
            item.top < -roomDepth / 2 ||
            item.bottom > roomDepth / 2
        )
      : [];

    return {
      collisions,
      missingDimensions,
      outsideFurniture,
      checkedCount: validBounds.length,
      visibleCount: visibleFurniture.length,
      roomIsValid,
    };
  }, [currentRoom, furniture]);

  const hasCollisions = result.collisions.length > 0;
  const hasMissingDimensions = result.missingDimensions.length > 0;
  const hasOutsideFurniture = result.outsideFurniture.length > 0;

  const statusColor = hasCollisions ? "#dc2626" : "#16a34a";

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
        Furniture Collision Detector
      </h2>

      <p
        style={{
          margin: "0 0 18px",
          fontSize: 14,
          color: "#6b7280",
          lineHeight: 1.5,
        }}
      >
        Checks visible furniture for overlapping bounding boxes and
        furniture that extends beyond the room boundaries.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: 16,
          borderRadius: 10,
          background: hasCollisions ? "#fef2f2" : "#f0fdf4",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: hasCollisions ? "#fee2e2" : "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 24,
          }}
        >
          {hasCollisions ? "!" : "✓"}
        </div>

        <div>
          <h3 style={{ margin: "0 0 5px", color: statusColor }}>
            {hasCollisions
              ? "Potential collisions found"
              : "No collisions detected"}
          </h3>

          <p style={{ margin: 0, fontSize: 14 }}>
            {result.collisions.length} overlapping pair(s) found among{" "}
            {result.checkedCount} furniture item(s) with valid dimensions.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 14,
            background: "#f9fafb",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Items checked
          </p>
          <strong style={{ fontSize: 24 }}>{result.checkedCount}</strong>
        </div>

        <div
          style={{
            padding: 14,
            background: "#fef2f2",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Collisions
          </p>
          <strong style={{ fontSize: 24, color: "#dc2626" }}>
            {result.collisions.length}
          </strong>
        </div>

        <div
          style={{
            padding: 14,
            background: "#fff7ed",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Outside room
          </p>
          <strong style={{ fontSize: 24, color: "#c2410c" }}>
            {result.outsideFurniture.length}
          </strong>
        </div>
      </div>

      {!result.roomIsValid && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: "#fff7ed",
            color: "#9a3412",
            fontSize: 14,
          }}
        >
          Enter valid room width and depth to check furniture against
          the room boundaries.
        </div>
      )}

      <h3 style={{ fontSize: 16, margin: "0 0 10px" }}>
        Collision details
      </h3>

      {!hasCollisions ? (
        <p
          style={{
            padding: 14,
            background: "#f9fafb",
            borderRadius: 8,
            color: "#4b5563",
            fontSize: 14,
          }}
        >
          No overlapping bounding boxes were detected. This does not
          guarantee that walking paths or door access are clear.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {result.collisions.map((collision, index) => (
            <div
              key={`${String(collision.first.id)}-${String(
                collision.second.id
              )}`}
              style={{
                padding: 14,
                border: "1px solid #fecaca",
                borderLeft: "4px solid #dc2626",
                borderRadius: 8,
                background: "#fffafa",
              }}
            >
              <strong>
                {index + 1}. {collision.first.name || "Furniture item"}{" "}
                ↔ {collision.second.name || "Furniture item"}
              </strong>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#6b7280",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Estimated overlap:{" "}
                {collision.overlapWidth.toFixed(1)} ×{" "}
                {collision.overlapDepth.toFixed(1)} square-unit dimensions.
              </p>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                Suggestion: move one item away from the other, or
                reduce its size, then check again.
              </p>
            </div>
          ))}
        </div>
      )}

      {hasOutsideFurniture && (
        <>
          <h3 style={{ fontSize: 16, margin: "22px 0 10px" }}>
            Furniture outside room boundaries
          </h3>

          <ul style={{ paddingLeft: 20 }}>
            {result.outsideFurniture.map((item) => (
              <li
                key={item.item.id}
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                {item.item.name || "Unnamed furniture"} — move it farther
                inside the room.
              </li>
            ))}
          </ul>
        </>
      )}

      {hasMissingDimensions && (
        <>
          <h3 style={{ fontSize: 16, margin: "22px 0 10px" }}>
            Items needing valid data
          </h3>

          <ul style={{ paddingLeft: 20 }}>
            {result.missingDimensions.map((item) => (
              <li
                key={item.id}
                style={{ marginBottom: 8, fontSize: 14 }}
              >
                {item.name || "Unnamed furniture"} — check its width,
                depth, scale, position, and rotation.
              </li>
            ))}
          </ul>
        </>
      )}

      <div
        style={{
          marginTop: 20,
          padding: 12,
          borderRadius: 8,
          background: "#f3f4f6",
          color: "#4b5563",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <strong>Note:</strong> This version compares rotated rectangular
        bounding boxes, so it can report a collision even when the actual
        furniture shapes do not touch. It assumes furniture x and y
        coordinates are center positions and that the room is centered
        at (0, 0). Results depend on your editor using those same units.
      </div>
    </section>
  );
}

export default FurnitureCollisionDetector;
