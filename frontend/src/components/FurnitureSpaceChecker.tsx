
import { useMemo } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureSpaceCheckerProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
}

function FurnitureSpaceChecker({
  currentRoom,
  furniture,
}: FurnitureSpaceCheckerProps) {
  const report = useMemo(() => {
    const roomArea = currentRoom.width * currentRoom.depth;

    const visibleFurniture = furniture.filter(
      (item) => item.visible
    );

    const itemsWithDimensions = visibleFurniture.filter(
      (item) =>
        typeof item.width === "number" &&
        typeof item.depth === "number" &&
        Number.isFinite(item.width) &&
        Number.isFinite(item.depth) &&
        item.width > 0 &&
        item.depth > 0
    );

    const missingDimensions =
      visibleFurniture.length - itemsWithDimensions.length;

    const furnitureArea = itemsWithDimensions.reduce(
      (total, item) => total + item.width! * item.depth!,
      0
    );

    const occupiedPercentage =
      roomArea > 0 ? (furnitureArea / roomArea) * 100 : 0;

    const remainingArea = roomArea - furnitureArea;

    return {
      roomArea,
      visibleCount: visibleFurniture.length,
      measuredCount: itemsWithDimensions.length,
      missingDimensions,
      furnitureArea,
      occupiedPercentage,
      remainingArea,
    };
  }, [currentRoom, furniture]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(value);

  const hasValidRoom =
    Number.isFinite(report.roomArea) && report.roomArea > 0;

  const percentage = Math.max(
    0,
    Math.min(100, report.occupiedPercentage)
  );

  let status = "Room has available floor space";
  let statusColor = "#166534";
  let statusBackground = "#dcfce7";

  if (!hasValidRoom) {
    status = "Check your room dimensions";
    statusColor = "#991b1b";
    statusBackground = "#fee2e2";
  } else if (report.occupiedPercentage >= 70) {
    status = "High estimated floor-space usage";
    statusColor = "#991b1b";
    statusBackground = "#fee2e2";
  } else if (report.occupiedPercentage >= 40) {
    status = "Moderate estimated floor-space usage";
    statusColor = "#92400e";
    statusBackground = "#fef3c7";
  }

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
        Furniture Space Checker
      </h2>

      <p style={{ color: "#4b5563" }}>
        Review the estimated floor area used by your visible
        furniture items.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(145px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#f3f4f6",
          }}
        >
          <p style={{ margin: 0, color: "#4b5563" }}>
            Room floor area
          </p>
          <h3 style={{ marginBottom: 0 }}>
            {hasValidRoom
              ? `${formatNumber(report.roomArea)} cm²`
              : "Invalid"}
          </h3>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#f3f4f6",
          }}
        >
          <p style={{ margin: 0, color: "#4b5563" }}>
            Visible furniture
          </p>
          <h3 style={{ marginBottom: 0 }}>
            {report.visibleCount}
          </h3>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#f3f4f6",
          }}
        >
          <p style={{ margin: 0, color: "#4b5563" }}>
            Measured furniture
          </p>
          <h3 style={{ marginBottom: 0 }}>
            {report.measuredCount}
          </h3>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 8,
          background: statusBackground,
          color: statusColor,
        }}
      >
        <strong>{status}</strong>

        {hasValidRoom && (
          <>
            <p style={{ marginBottom: 0 }}>
              Estimated floor-space usage:{" "}
              {formatNumber(report.occupiedPercentage)}%
            </p>
          </>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <strong>Estimated floor-space usage</strong>
          <span>{formatNumber(percentage)}%</span>
        </div>

        <div
          role="progressbar"
          aria-label="Estimated floor-space usage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          style={{
            height: 14,
            borderRadius: 20,
            overflow: "hidden",
            background: "#e5e7eb",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentage}%`,
              background:
                report.occupiedPercentage >= 70
                  ? "#dc2626"
                  : report.occupiedPercentage >= 40
                    ? "#d97706"
                    : "#16a34a",
              transition: "width 0.2s ease",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <p>
          <strong>Estimated furniture footprint:</strong>{" "}
          {formatNumber(report.furnitureArea)} cm²
        </p>

        <p>
          <strong>Estimated remaining area:</strong>{" "}
          {formatNumber(report.remainingArea)} cm²
        </p>
      </div>

      {report.missingDimensions > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fef3c7",
            color: "#92400e",
            marginTop: 12,
          }}
        >
          <strong>
            {report.missingDimensions} item(s) need dimensions.
          </strong>
          <p style={{ marginBottom: 0 }}>
            Add valid width and depth values to those furniture
            items for a more complete estimate.
          </p>
        </div>
      )}

      {report.occupiedPercentage > 100 && (
        <p style={{ color: "#b91c1c", fontWeight: 600 }}>
          The combined furniture footprints exceed the room
          floor area. Check the dimensions and arrangement.
        </p>
      )}

      <p
        style={{
          marginBottom: 0,
          marginTop: 18,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        This is an estimate based on stored width and depth.
        It does not account for overlapping furniture, walking
        paths, rotation, or wall clearance. Make sure the room
        and furniture dimensions use the same unit.
      </p>
    </section>
  );
}

export default FurnitureSpaceChecker;
