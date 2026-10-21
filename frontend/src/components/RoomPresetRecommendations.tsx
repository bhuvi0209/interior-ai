
import { useMemo } from "react";
import type { RoomSettings } from "../types/Project";

interface RoomPresetRecommendationsProps {
  currentRoom: RoomSettings;
  onApply: (preset: {
    width: number;
    depth: number;
    wallHeight: number;
  }) => void;
}

interface RecommendedPreset {
  name: string;
  width: number;
  depth: number;
  wallHeight: number;
  description: string;
}

const recommendedPresets: RecommendedPreset[] = [
  {
    name: "Small Room",
    width: 300,
    depth: 300,
    wallHeight: 270,
    description: "A compact room for smaller spaces.",
  },
  {
    name: "Bedroom",
    width: 400,
    depth: 350,
    wallHeight: 300,
    description: "A balanced size for a bedroom layout.",
  },
  {
    name: "Living Room",
    width: 600,
    depth: 450,
    wallHeight: 300,
    description: "More floor space for seating and furniture.",
  },
  {
    name: "Large Room",
    width: 800,
    depth: 600,
    wallHeight: 320,
    description: "A spacious layout with extra room to arrange furniture.",
  },
];

function RoomPresetRecommendations({
  currentRoom,
  onApply,
}: RoomPresetRecommendationsProps) {
  const recommendation = useMemo(() => {
    const currentArea = currentRoom.width * currentRoom.depth;

    return [...recommendedPresets]
      .map((preset) => {
        const presetArea = preset.width * preset.depth;

        const areaDifference =
          Math.abs(currentArea - presetArea) /
          Math.max(currentArea, presetArea, 1);

        const heightDifference =
          Math.abs(currentRoom.wallHeight - preset.wallHeight) /
          Math.max(
            currentRoom.wallHeight,
            preset.wallHeight,
            1
          );

        return {
          ...preset,
          score: areaDifference * 0.8 + heightDifference * 0.2,
        };
      })
      .sort((a, b) => a.score - b.score)[0];
  }, [
    currentRoom.width,
    currentRoom.depth,
    currentRoom.wallHeight,
  ]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat().format(value);

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
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>
        Room Preset Recommendation
      </h2>

      <p style={{ marginTop: 0, color: "#4b5563" }}>
        Find a built-in room preset that most closely matches
        your current room dimensions.
      </p>

      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: "#f3f4f6",
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>
          Recommended: {recommendation.name}
        </h3>

        <p style={{ marginTop: 0 }}>
          {recommendation.description}
        </p>

        <p>
          <strong>Width:</strong>{" "}
          {formatNumber(recommendation.width)} cm
        </p>

        <p>
          <strong>Depth:</strong>{" "}
          {formatNumber(recommendation.depth)} cm
        </p>

        <p>
          <strong>Wall height:</strong>{" "}
          {formatNumber(recommendation.wallHeight)} cm
        </p>

        <p>
          <strong>Floor area:</strong>{" "}
          {formatNumber(
            recommendation.width * recommendation.depth
          )}{" "}
          cm²
        </p>

        <button
          type="button"
          onClick={() =>
            onApply({
              width: recommendation.width,
              depth: recommendation.depth,
              wallHeight: recommendation.wallHeight,
            })
          }
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: 8,
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Apply Recommendation
        </button>
      </div>

      <h3>Other available presets</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {recommendedPresets.map((preset) => {
          const isRecommended = preset.name === recommendation.name;

          return (
            <div
              key={preset.name}
              style={{
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            >
              <strong>{preset.name}</strong>

              {isRecommended && (
                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#2563eb",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Best match
                </span>
              )}

              <p style={{ fontSize: 13 }}>
                {preset.width} × {preset.depth} ×{" "}
                {preset.wallHeight} cm
              </p>

              <button
                type="button"
                onClick={() =>
                  onApply({
                    width: preset.width,
                    depth: preset.depth,
                    wallHeight: preset.wallHeight,
                  })
                }
                style={{
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RoomPresetRecommendations;
