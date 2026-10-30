
import { useMemo } from "react";
import type { FurnitureItem, RoomSettings } from "../types/Project";

interface FurnitureLayoutReportProps {
  currentRoom: RoomSettings;
  furniture: FurnitureItem[];
}

interface CheckedItem {
  item: FurnitureItem;
  area: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface ReportIssue {
  title: string;
  detail: string;
  type: "warning" | "error" | "info";
}

function FurnitureLayoutReport({
  currentRoom,
  furniture,
}: FurnitureLayoutReportProps) {
  const report = useMemo(() => {
    const roomWidth = Number(currentRoom.width);
    const roomDepth = Number(currentRoom.depth);

    const validRoom =
      Number.isFinite(roomWidth) &&
      Number.isFinite(roomDepth) &&
      roomWidth > 0 &&
      roomDepth > 0;

    const roomArea = validRoom ? roomWidth * roomDepth : 0;
    const visibleItems = furniture.filter((item) => item.visible);

    const checkedItems: CheckedItem[] = [];
    const missingItems: FurnitureItem[] = [];
    const issues: ReportIssue[] = [];

    for (const item of visibleItems) {
      const width = Number(item.width);
      const depth = Number(item.depth);
      const scale = Number(item.scale);
      const x = Number(item.x);
      const y = Number(item.y);
      const rotation = Number(item.rotation);

      const validFurniture =
        Number.isFinite(width) &&
        Number.isFinite(depth) &&
        Number.isFinite(scale) &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(rotation) &&
        width > 0 &&
        depth > 0 &&
        scale > 0;

      if (!validFurniture) {
        missingItems.push(item);

        issues.push({
          title: `${item.name || "Unnamed furniture"}: check dimensions`,
          detail:
            "Width, depth, scale, position, or rotation is missing or invalid.",
          type: "warning",
        });

        continue;
      }

      const scaledWidth = width * scale;
      const scaledDepth = depth * scale;
      const radians = (rotation * Math.PI) / 180;

      const rotatedWidth =
        Math.abs(scaledWidth * Math.cos(radians)) +
        Math.abs(scaledDepth * Math.sin(radians));

      const rotatedDepth =
        Math.abs(scaledWidth * Math.sin(radians)) +
        Math.abs(scaledDepth * Math.cos(radians));

      checkedItems.push({
        item,
        area: scaledWidth * scaledDepth,
        left: x - rotatedWidth / 2,
        right: x + rotatedWidth / 2,
        top: y - rotatedDepth / 2,
        bottom: y + rotatedDepth / 2,
      });
    }

    let outsideCount = 0;
    let collisionCount = 0;

    if (validRoom) {
      for (const checked of checkedItems) {
        const outside =
          checked.left < -roomWidth / 2 ||
          checked.right > roomWidth / 2 ||
          checked.top < -roomDepth / 2 ||
          checked.bottom > roomDepth / 2;

        if (outside) {
          outsideCount++;

          issues.push({
            title: `${checked.item.name || "Unnamed furniture"}: check position`,
            detail:
              "The furniture's bounding box may extend beyond the room boundaries.",
            type: "error",
          });
        }
      }

      for (let i = 0; i < checkedItems.length; i++) {
        for (let j = i + 1; j < checkedItems.length; j++) {
          const first = checkedItems[i];
          const second = checkedItems[j];

          const overlaps =
            first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top;

          if (overlaps) {
            collisionCount++;

            issues.push({
              title: `Possible overlap: ${
                first.item.name || "Unnamed furniture"
              } and ${second.item.name || "Unnamed furniture"}`,
              detail:
                "Their rectangular bounding boxes overlap. Check the 3D scene to confirm whether the actual furniture shapes collide.",
              type: "warning",
            });
          }
        }
      }
    } else {
      issues.push({
        title: "Room dimensions need attention",
        detail:
          "Enter a positive room width and depth to calculate floor area and check room boundaries.",
        type: "error",
      });
    }

    const totalFurnitureArea = checkedItems.reduce(
      (sum, checked) => sum + checked.area,
      0
    );

    const occupancyPercent =
      roomArea > 0 ? (totalFurnitureArea / roomArea) * 100 : 0;

    if (visibleItems.length === 0) {
      issues.push({
        title: "No visible furniture",
        detail:
          "Add or show furniture to generate a more useful layout report.",
        type: "info",
      });
    }

    if (roomArea > 0 && occupancyPercent > 70) {
      issues.push({
        title: "High estimated floor-space usage",
        detail:
          "Furniture footprints exceed 70% of the room area. Consider checking whether enough open floor space remains.",
        type: "warning",
      });
    } else if (roomArea > 0 && occupancyPercent > 55) {
      issues.push({
        title: "Review available floor space",
        detail:
          "Furniture footprints use more than 55% of the room area. Review circulation paths and clearances.",
        type: "info",
      });
    }

    if (
      validRoom &&
      visibleItems.length > 0 &&
      missingItems.length === 0 &&
      outsideCount === 0 &&
      collisionCount === 0
    ) {
      issues.push({
        title: "No basic layout issues detected",
        detail:
          "The checks found no missing dimensions, boundary violations, or overlapping bounding boxes. This does not guarantee comfortable walking paths or accessibility.",
        type: "info",
      });
    }

    return {
      roomWidth,
      roomDepth,
      roomArea,
      validRoom,
      visibleCount: visibleItems.length,
      hiddenCount: furniture.length - visibleItems.length,
      checkedCount: checkedItems.length,
      missingCount: missingItems.length,
      outsideCount,
      collisionCount,
      totalFurnitureArea,
      occupancyPercent,
      issues,
    };
  }, [currentRoom, furniture]);

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const lines = [
      "INTERIOR AI - FURNITURE LAYOUT QUALITY REPORT",
      "",
      `Room width: ${report.validRoom ? report.roomWidth : "Invalid"}`,
      `Room depth: ${report.validRoom ? report.roomDepth : "Invalid"}`,
      `Room floor area: ${formatNumber(report.roomArea)}`,
      "",
      `Visible furniture: ${report.visibleCount}`,
      `Hidden furniture: ${report.hiddenCount}`,
      `Items with valid dimensions: ${report.checkedCount}`,
      `Items needing data checks: ${report.missingCount}`,
      `Items potentially outside the room: ${report.outsideCount}`,
      `Potential overlapping pairs: ${report.collisionCount}`,
      `Estimated furniture footprint: ${formatNumber(
        report.totalFurnitureArea
      )}`,
      `Estimated floor-space usage: ${
        report.validRoom
          ? `${report.occupancyPercent.toFixed(1)}%`
          : "Unavailable"
      }`,
      "",
      "FINDINGS AND SUGGESTIONS",
      ...report.issues.map(
        (issue, index) =>
          `${index + 1}. [${issue.type.toUpperCase()}] ${issue.title}\n   ${issue.detail}`
      ),
      "",
      "Note: This is an approximate report based on furniture dimensions and bounding boxes. Verify clearances and layout in the 3D editor.",
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-layout-report.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const issueColor = (type: ReportIssue["type"]) => {
    if (type === "error") return "#b91c1c";
    if (type === "warning") return "#b45309";
    return "#1d4ed8";
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>
            Furniture Layout Quality Report
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            A summary of room dimensions, furniture footprints, and
            potential layout issues.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleDownload}
            style={{
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 7,
              background: "#ffffff",
              color: "#1f2937",
              cursor: "pointer",
            }}
          >
            Download report
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "9px 12px",
              border: "none",
              borderRadius: 7,
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Print report
          </button>
        </div>
      </div>

      <hr
        style={{
          border: 0,
          borderTop: "1px solid #e5e7eb",
          margin: "20px 0",
        }}
      />

      <h3 style={{ fontSize: 16, margin: "0 0 12px" }}>
        Room summary
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          gap: 10,
        }}
      >
        {[
          {
            label: "Room width",
            value: report.validRoom
              ? formatNumber(report.roomWidth)
              : "Invalid",
          },
          {
            label: "Room depth",
            value: report.validRoom
              ? formatNumber(report.roomDepth)
              : "Invalid",
          },
          {
            label: "Floor area",
            value: report.validRoom
              ? formatNumber(report.roomArea)
              : "Unavailable",
          },
          {
            label: "Visible furniture",
            value: String(report.visibleCount),
          },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              padding: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#f9fafb",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {metric.label}
            </p>

            <strong style={{ fontSize: 19 }}>{metric.value}</strong>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, margin: "22px 0 12px" }}>
        Layout checks
      </h3>

      <div style={{ display: "grid", gap: 10 }}>
        {[
          {
            label: "Items needing dimension checks",
            value: report.missingCount,
          },
          {
            label: "Items potentially outside room",
            value: report.outsideCount,
          },
          {
            label: "Potential overlapping pairs",
            value: report.collisionCount,
          },
          {
            label: "Hidden furniture excluded",
            value: report.hiddenCount,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, margin: "22px 0 12px" }}>
        Estimated floor-space usage
      </h3>

      <div
        style={{
          height: 12,
          background: "#e5e7eb",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, report.occupancyPercent)}%`,
            height: "100%",
            background:
              report.occupancyPercent > 70
                ? "#dc2626"
                : report.occupancyPercent > 55
                  ? "#d97706"
                  : "#16a34a",
          }}
        />
      </div>

      <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6 }}>
        Estimated furniture footprint:{" "}
        <strong>{formatNumber(report.totalFurnitureArea)}</strong> square
        units.
        <br />
        Estimated room floor area:{" "}
        <strong>{formatNumber(report.roomArea)}</strong> square units.
        <br />
        Estimated floor-space usage:{" "}
        <strong>
          {report.validRoom
            ? `${report.occupancyPercent.toFixed(1)}%`
            : "Unavailable"}
        </strong>
      </p>

      <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
        Footprints can overlap, so their summed area is not the same as
        the unique floor area covered. This percentage is a rough
        indicator, not a measurement of walking clearance.
      </p>

      <h3 style={{ fontSize: 16, margin: "22px 0 12px" }}>
        Findings and suggestions
      </h3>

      <div style={{ display: "grid", gap: 10 }}>
        {report.issues.map((issue, index) => (
          <div
            key={`${issue.title}-${index}`}
            style={{
              padding: 14,
              border: "1px solid #e5e7eb",
              borderLeft: `4px solid ${issueColor(issue.type)}`,
              borderRadius: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>{issue.title}</strong>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#4b5563",
              }}
            >
              {issue.detail}
            </p>
          </div>
        ))}
      </div>

      <p
        style={{
          margin: "20px 0 0",
          fontSize: 12,
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        Report limitations: checks use rectangular furniture bounding
        boxes and assume furniture x/y positions are center coordinates
        in the same units as room width and depth. Actual collision
        shapes, walking paths, door swings, and accessibility are not
        evaluated.
      </p>
    </section>
  );
}

export default FurnitureLayoutReport;
