
import { useMemo } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureArrangementScoreProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
}

interface FurnitureCheck {
  item: FurnitureItem;
  status: "good" | "outside" | "missing";
  area: number;
  message: string;
}

function FurnitureArrangementScore({
  currentRoom,
  furniture,
}: FurnitureArrangementScoreProps) {
  const result = useMemo(() => {
    const roomWidth = Number(currentRoom.width);
    const roomDepth = Number(currentRoom.depth);

    const roomArea =
      Number.isFinite(roomWidth) &&
      Number.isFinite(roomDepth) &&
      roomWidth > 0 &&
      roomDepth > 0
        ? roomWidth * roomDepth
        : 0;

    const visibleFurniture = furniture.filter((item) => item.visible);

    const checks: FurnitureCheck[] = visibleFurniture.map((item) => {
      const width = Number(item.width) * Number(item.scale);
      const depth = Number(item.depth) * Number(item.scale);
      const rotation = (Number(item.rotation) * Math.PI) / 180;

      if (
        !Number.isFinite(width) ||
        !Number.isFinite(depth) ||
        !Number.isFinite(Number(item.x)) ||
        !Number.isFinite(Number(item.y)) ||
        !Number.isFinite(rotation) ||
        width <= 0 ||
        depth <= 0 ||
        !roomArea
      ) {
        return {
          item,
          status: "missing",
          area: 0,
          message: "Add valid dimensions and position data.",
        };
      }

      // Calculate the rotated furniture footprint.
      const rotatedWidth =
        Math.abs(width * Math.cos(rotation)) +
        Math.abs(depth * Math.sin(rotation));

      const rotatedDepth =
        Math.abs(width * Math.sin(rotation)) +
        Math.abs(depth * Math.cos(rotation));

      // Assumes x and y are the furniture center in room units.
      const halfRoomWidth = roomWidth / 2;
      const halfRoomDepth = roomDepth / 2;

      const left = Number(item.x) - rotatedWidth / 2;
      const right = Number(item.x) + rotatedWidth / 2;
      const top = Number(item.y) - rotatedDepth / 2;
      const bottom = Number(item.y) + rotatedDepth / 2;

      const inside =
        left >= -halfRoomWidth &&
        right <= halfRoomWidth &&
        top >= -halfRoomDepth &&
        bottom <= halfRoomDepth;

      return {
        item,
        status: inside ? "good" : "outside",
        area: width * depth,
        message: inside
          ? "Fits within the room boundaries."
          : "May extend beyond the room boundaries.",
      };
    });

    const totalArea = checks.reduce(
      (sum, check) => sum + check.area,
      0
    );

    const goodCount = checks.filter(
      (check) => check.status === "good"
    ).length;

    const outsideCount = checks.filter(
      (check) => check.status === "outside"
    ).length;

    const missingCount = checks.filter(
      (check) => check.status === "missing"
    ).length;

    const occupancy = roomArea > 0 ? totalArea / roomArea : 0;

    // Start at 100 and deduct points for detected layout issues.
    let score = 100;

    if (checks.length === 0) {
      score = 0;
    } else {
      score -= outsideCount * 20;
      score -= missingCount * 10;

      if (occupancy > 0.70) {
        score -= 25;
      } else if (occupancy > 0.55) {
        score -= 15;
      } else if (occupancy > 0.40) {
        score -= 5;
      }

      score = Math.max(0, Math.min(100, score));
    }

    const suggestions: string[] = [];

    if (!roomArea) {
      suggestions.push(
        "Set valid room width and depth before checking the arrangement."
      );
    }

    if (checks.length === 0) {
      suggestions.push(
        "Add furniture to your room to receive an arrangement score."
      );
    }

    if (outsideCount > 0) {
      suggestions.push(
        `Move ${outsideCount} item(s) inside the room boundaries.`
      );
    }

    if (missingCount > 0) {
      suggestions.push(
        `Check the dimensions, scale, and position of ${missingCount} item(s).`
      );
    }

    if (roomArea && occupancy > 0.70) {
      suggestions.push(
        "The furniture footprint is high relative to the room area. Consider removing or resizing some pieces."
      );
    } else if (roomArea && occupancy > 0.55) {
      suggestions.push(
        "Consider reducing furniture sizes or removing a piece to create more open floor space."
      );
    }

    if (
      roomArea &&
      checks.length > 0 &&
      outsideCount === 0 &&
      missingCount === 0 &&
      occupancy <= 0.55
    ) {
      suggestions.push(
        "The measured furniture footprints fit within the room. Review walking paths and door access manually."
      );
    }

    return {
      score,
      checks,
      totalArea,
      roomArea,
      occupancy,
      goodCount,
      outsideCount,
      missingCount,
      suggestions,
    };
  }, [currentRoom, furniture]);

  const scoreLabel =
    result.score >= 85
      ? "Good"
      : result.score >= 65
        ? "Fair"
        : result.score > 0
          ? "Needs improvement"
          : "Not scored";

  const scoreColor =
    result.score >= 85
      ? "#16a34a"
      : result.score >= 65
        ? "#d97706"
        : "#dc2626";

  const formatArea = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    });

  return (
    <section
      style={{
        padding: 20,
        margin: "20px 0",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        background: "#ffffff",
        color: "#1f2937",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>
        Furniture Arrangement Score
      </h2>

      <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: 14 }}>
        A basic layout check using furniture footprints, room boundaries,
        and estimated floor-space usage.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          padding: 16,
          background: "#f9fafb",
          borderRadius: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `8px solid ${scoreColor}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <strong style={{ fontSize: 30, lineHeight: 1.1 }}>
            {result.score}
          </strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            out of 100
          </span>
        </div>

        <div>
          <h3 style={{ margin: "0 0 6px", color: scoreColor }}>
            {scoreLabel}
          </h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            {result.checks.length} visible furniture item(s) checked
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>
            {result.goodCount} within boundaries · {result.outsideCount}{" "}
            outside · {result.missingCount} needing data
          </p>
        </div>
      </div>

      <h3 style={{ fontSize: 16 }}>Room space usage</h3>

      <div
        style={{
          width: "100%",
          height: 12,
          borderRadius: 10,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, result.occupancy * 100)}%`,
            height: "100%",
            background: scoreColor,
            borderRadius: 10,
            transition: "width 0.2s ease",
          }}
        />
      </div>

      <p style={{ fontSize: 14, color: "#4b5563" }}>
        Estimated furniture footprint:{" "}
        <strong>{formatArea(result.totalArea)}</strong> /{" "}
        <strong>{formatArea(result.roomArea)}</strong> square units
        {result.roomArea > 0
          ? ` (${(result.occupancy * 100).toFixed(1)}%)`
          : ""}
      </p>

      <p style={{ fontSize: 12, color: "#6b7280" }}>
        This measures furniture footprints, not actual walking clearance.
        Overlapping furniture is not detected.
      </p>

      <h3 style={{ fontSize: 16, marginTop: 22 }}>
        Furniture checks
      </h3>

      {result.checks.length === 0 ? (
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          No visible furniture found. Add furniture to see the results.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {result.checks.map((check) => {
            const itemColor =
              check.status === "good"
                ? "#15803d"
                : check.status === "outside"
                  ? "#b91c1c"
                  : "#b45309";

            return (
              <div
                key={check.item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderLeft: `4px solid ${itemColor}`,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{check.item.name || "Unnamed furniture"}</strong>
                  <span
                    style={{
                      color: itemColor,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {check.status === "good"
                      ? "Within room"
                      : check.status === "outside"
                        ? "Check position"
                        : "Check data"}
                  </span>
                </div>

                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  {check.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 16, marginTop: 22 }}>
        Suggestions
      </h3>

      <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
        {result.suggestions.map((suggestion, index) => (
          <li
            key={index}
            style={{
              marginBottom: 8,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FurnitureArrangementScore;
