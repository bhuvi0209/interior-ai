
import { useMemo } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureArrangementValidatorProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
}

interface ValidationResult {
  item: FurnitureItem;
  status: "inside" | "outside" | "unknown";
  message: string;
}

function FurnitureArrangementValidator({
  currentRoom,
  furniture,
}: FurnitureArrangementValidatorProps) {
  const results = useMemo<ValidationResult[]>(() => {
    const roomWidth = currentRoom.width;
    const roomDepth = currentRoom.depth;

    if (
      !Number.isFinite(roomWidth) ||
      !Number.isFinite(roomDepth) ||
      roomWidth <= 0 ||
      roomDepth <= 0
    ) {
      return furniture
        .filter((item) => item.visible)
        .map((item) => ({
          item,
          status: "unknown",
          message: "Room dimensions are invalid.",
        }));
    }

    return furniture
      .filter((item) => item.visible)
      .map((item): ValidationResult => {
        if (
          typeof item.width !== "number" ||
          typeof item.depth !== "number" ||
          !Number.isFinite(item.width) ||
          !Number.isFinite(item.depth) ||
          item.width <= 0 ||
          item.depth <= 0 ||
          !Number.isFinite(item.x) ||
          !Number.isFinite(item.y) ||
          !Number.isFinite(item.rotation) ||
          !Number.isFinite(item.scale) ||
          item.scale <= 0
        ) {
          return {
            item,
            status: "unknown",
            message:
              "Add valid position, width, depth, and scale values.",
          };
        }

        // Assumes x and y are the furniture center in room units,
        // rotation is in degrees, and width/depth are in the same
        // units as the room dimensions.
        const width = item.width * item.scale;
        const depth = item.depth * item.scale;
        const radians = (item.rotation * Math.PI) / 180;

        // Calculate the axis-aligned bounds of the rotated footprint.
        const halfWidth =
          (Math.abs(width * Math.cos(radians)) +
            Math.abs(depth * Math.sin(radians))) /
          2;

        const halfDepth =
          (Math.abs(width * Math.sin(radians)) +
            Math.abs(depth * Math.cos(radians))) /
          2;

        const left = item.x - halfWidth;
        const right = item.x + halfWidth;
        const top = item.y - halfDepth;
        const bottom = item.y + halfDepth;

        const epsilon = 0.001;

        const inside =
          left >= -epsilon &&
          top >= -epsilon &&
          right <= roomWidth + epsilon &&
          bottom <= roomDepth + epsilon;

        if (inside) {
          return {
            item,
            status: "inside",
            message: "Fits within the room boundaries.",
          };
        }

        const issues: string[] = [];

        if (left < -epsilon) {
          issues.push("extends beyond the left edge");
        }

        if (right > roomWidth + epsilon) {
          issues.push("extends beyond the right edge");
        }

        if (top < -epsilon) {
          issues.push("extends beyond the front edge");
        }

        if (bottom > roomDepth + epsilon) {
          issues.push("extends beyond the back edge");
        }

        return {
          item,
          status: "outside",
          message: issues.length
            ? issues.join(", ") + "."
            : "Check the furniture position.",
        };
      });
  }, [currentRoom, furniture]);

  const insideCount = results.filter(
    (result) => result.status === "inside"
  ).length;

  const outsideCount = results.filter(
    (result) => result.status === "outside"
  ).length;

  const unknownCount = results.filter(
    (result) => result.status === "unknown"
  ).length;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <section
      style={{
        marginTop: 24,
        padding: 20,
        border: "1px solid #d1d5db",
        borderRadius: 12,
        background: "#ffffff",
        color: "#111827",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Furniture Arrangement Validator
      </h2>

      <p style={{ color: "#4b5563" }}>
        Check whether visible furniture fits inside the room
        boundaries, accounting for its rotation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            padding: 12,
            background: "#dcfce7",
            borderRadius: 8,
            color: "#166534",
          }}
        >
          <div>Inside room</div>
          <strong style={{ fontSize: 24 }}>
            {insideCount}
          </strong>
        </div>

        <div
          style={{
            padding: 12,
            background: "#fee2e2",
            borderRadius: 8,
            color: "#991b1b",
          }}
        >
          <div>Outside room</div>
          <strong style={{ fontSize: 24 }}>
            {outsideCount}
          </strong>
        </div>

        <div
          style={{
            padding: 12,
            background: "#fef3c7",
            borderRadius: 8,
            color: "#92400e",
          }}
        >
          <div>Needs checking</div>
          <strong style={{ fontSize: 24 }}>
            {unknownCount}
          </strong>
        </div>
      </div>

      {results.length === 0 ? (
        <p>
          No visible furniture to check. Add furniture to see
          arrangement results.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {results.map((result) => {
            const background =
              result.status === "inside"
                ? "#f0fdf4"
                : result.status === "outside"
                  ? "#fef2f2"
                  : "#fffbeb";

            const color =
              result.status === "inside"
                ? "#166534"
                : result.status === "outside"
                  ? "#991b1b"
                  : "#92400e";

            const label =
              result.status === "inside"
                ? "Fits"
                : result.status === "outside"
                  ? "Outside boundary"
                  : "Cannot verify";

            return (
              <div
                key={result.item.id}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background,
                  border: `1px solid ${color}30`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{result.item.name}</strong>

                  <span
                    style={{
                      color,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </span>
                </div>

                <p
                  style={{
                    marginBottom: 0,
                    marginTop: 8,
                    color,
                    fontSize: 14,
                  }}
                >
                  {result.message}
                </p>

                {result.status !== "unknown" && (
                  <p
                    style={{
                      marginBottom: 0,
                      fontSize: 12,
                      color: "#4b5563",
                    }}
                  >
                    Position: ({formatNumber(result.item.x)},{" "}
                    {formatNumber(result.item.y)})
                    {" · "}
                    Rotation: {formatNumber(result.item.rotation)}°
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p
        style={{
          marginBottom: 0,
          marginTop: 18,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        This check assumes furniture x/y coordinates represent
        the center of each item, in the same units as the room.
        If your editor uses pixel coordinates or a different
        origin, the coordinate conversion must be adjusted.
      </p>
    </section>
  );
}

export default FurnitureArrangementValidator;
