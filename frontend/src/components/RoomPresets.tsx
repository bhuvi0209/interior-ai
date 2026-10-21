
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import type { RoomPreset } from "../types/RoomPreset";
import type { RoomSettings } from "../types/Project";

interface RoomPresetsProps {
  currentRoom: RoomSettings;
  onApply: (preset: RoomPreset) => void;
}

interface PresetHistoryEntry {
  id: string;
  name: string;
  appliedAt: string;
}

const PRESETS_STORAGE_KEY = "interior-ai-room-presets";
const FAVORITES_STORAGE_KEY = "interior-ai-room-preset-favorites";
const HISTORY_STORAGE_KEY = "interior-ai-room-preset-history";

const DEFAULT_PRESETS: RoomPreset[] = [
  {
    id: "small-room",
    name: "Small Room",
    width: 300,
    depth: 300,
    wallHeight: 270,
  },
  {
    id: "bedroom",
    name: "Bedroom",
    width: 400,
    depth: 350,
    wallHeight: 300,
  },
  {
    id: "living-room",
    name: "Living Room",
    width: 600,
    depth: 450,
    wallHeight: 300,
  },
  {
    id: "large-room",
    name: "Large Room",
    width: 800,
    depth: 600,
    wallHeight: 320,
  },
];

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  section: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: 16,
    background: "#ffffff",
  },
  heading: {
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 12px",
  },
  subheading: {
    fontSize: 15,
    fontWeight: 700,
    margin: "0 0 10px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 14,
  },
  button: {
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    background: "#f8fafc",
    color: "#111827",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  primaryButton: {
    padding: "9px 12px",
    border: "1px solid #2563eb",
    borderRadius: 6,
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  dangerButton: {
    padding: "9px 12px",
    border: "1px solid #dc2626",
    borderRadius: 6,
    background: "#fff7f7",
    color: "#b91c1c",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 9,
    minWidth: 0,
  },
  muted: {
    fontSize: 12,
    color: "#64748b",
  },
  error: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  tableCell: {
    borderBottom: "1px solid #e2e8f0",
    padding: "10px 8px",
    textAlign: "left",
    verticalAlign: "top",
  },
  favorite: {
    color: "#b45309",
    fontWeight: 700,
  },
};

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function createId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidPreset(value: unknown): value is RoomPreset {
  if (!value || typeof value !== "object") return false;

  const preset = value as Partial<RoomPreset>;

  return (
    typeof preset.id === "string" &&
    typeof preset.name === "string" &&
    preset.name.trim().length > 0 &&
    typeof preset.width === "number" &&
    Number.isFinite(preset.width) &&
    preset.width > 0 &&
    typeof preset.depth === "number" &&
    Number.isFinite(preset.depth) &&
    preset.depth > 0 &&
    typeof preset.wallHeight === "number" &&
    Number.isFinite(preset.wallHeight) &&
    preset.wallHeight > 0
  );
}

function getArea(preset: RoomPreset): number {
  return preset.width * preset.depth;
}

function getVolume(preset: RoomPreset): number {
  return preset.width * preset.depth * preset.wallHeight;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export default function RoomPresets({
  currentRoom,
  onApply,
}: RoomPresetsProps) {
  const [customPresets, setCustomPresets] = useState<RoomPreset[]>(() =>
    readLocalStorage<RoomPreset[]>(PRESETS_STORAGE_KEY, []).filter(
      isValidPreset,
    ),
  );

  const [favorites, setFavorites] = useState<string[]>(() =>
    readLocalStorage<string[]>(FAVORITES_STORAGE_KEY, []),
  );

  const [history, setHistory] = useState<PresetHistoryEntry[]>(() =>
    readLocalStorage<PresetHistoryEntry[]>(HISTORY_STORAGE_KEY, []),
  );

  const [presetName, setPresetName] = useState("");
  const [width, setWidth] = useState(String(currentRoom.width));
  const [depth, setDepth] = useState(String(currentRoom.depth));
  const [wallHeight, setWallHeight] = useState(
    String(currentRoom.wallHeight),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const allPresets = useMemo(
    () => [...DEFAULT_PRESETS, ...customPresets],
    [customPresets],
  );

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
    } catch {
      setError("Could not save presets to browser storage.");
    }
  }, [customPresets]);

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favorites),
      );
    } catch {
      setError("Could not save favorites to browser storage.");
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      setError("Could not save history to browser storage.");
    }
  }, [history]);

  const visiblePresets = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = allPresets.filter((preset) => {
      const matchesSearch =
        preset.name.toLowerCase().includes(query) ||
        String(preset.width).includes(query) ||
        String(preset.depth).includes(query) ||
        String(preset.wallHeight).includes(query);

      const matchesFavorite =
        !favoritesOnly || favorites.includes(preset.id);

      return matchesSearch && matchesFavorite;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "width":
          return a.width - b.width;
        case "depth":
          return a.depth - b.depth;
        case "height":
          return a.wallHeight - b.wallHeight;
        case "area":
          return getArea(a) - getArea(b);
        case "popular": {
          const countA = history.filter((item) => item.id === a.id).length;
          const countB = history.filter((item) => item.id === b.id).length;
          return countB - countA;
        }
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [allPresets, search, favoritesOnly, favorites, sortBy, history]);

  const presetA = allPresets.find((preset) => preset.id === compareA);
  const presetB = allPresets.find((preset) => preset.id === compareB);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function resetForm() {
    setPresetName("");
    setWidth(String(currentRoom.width));
    setDepth(String(currentRoom.depth));
    setWallHeight(String(currentRoom.wallHeight));
    setEditingId(null);
  }

  function savePreset() {
    clearMessages();

    const name = presetName.trim();
    const numericWidth = Number(width);
    const numericDepth = Number(depth);
    const numericHeight = Number(wallHeight);

    if (!name) {
      setError("Enter a name for the room preset.");
      return;
    }

    if (
      !Number.isFinite(numericWidth) ||
      !Number.isFinite(numericDepth) ||
      !Number.isFinite(numericHeight) ||
      numericWidth <= 0 ||
      numericDepth <= 0 ||
      numericHeight <= 0
    ) {
      setError("Width, depth, and wall height must all be positive numbers.");
      return;
    }

    const duplicateName = allPresets.some(
      (preset) =>
        preset.name.trim().toLowerCase() === name.toLowerCase() &&
        preset.id !== editingId,
    );

    if (duplicateName) {
      setError("A preset with that name already exists.");
      return;
    }

    if (editingId && DEFAULT_PRESETS.some((p) => p.id === editingId)) {
      setError("Default presets cannot be edited. Save a custom copy instead.");
      return;
    }

    if (editingId) {
      setCustomPresets((previous) =>
        previous.map((preset) =>
          preset.id === editingId
            ? {
                ...preset,
                name,
                width: numericWidth,
                depth: numericDepth,
                wallHeight: numericHeight,
              }
            : preset,
        ),
      );
      setNotice("Room preset updated.");
    } else {
      const newPreset: RoomPreset = {
        id: createId(),
        name,
        width: numericWidth,
        depth: numericDepth,
        wallHeight: numericHeight,
      };

      setCustomPresets((previous) => [...previous, newPreset]);
      setNotice("Room preset saved.");
    }

    resetForm();
  }

  function startEditing(preset: RoomPreset) {
    clearMessages();

    if (DEFAULT_PRESETS.some((item) => item.id === preset.id)) {
      setError("Default presets cannot be edited. You can save a custom copy.");
      return;
    }

    setEditingId(preset.id);
    setPresetName(preset.name);
    setWidth(String(preset.width));
    setDepth(String(preset.depth));
    setWallHeight(String(preset.wallHeight));
    setNotice("Edit the values and choose Update Preset.");
  }

  function deletePreset(preset: RoomPreset) {
    clearMessages();

    if (DEFAULT_PRESETS.some((item) => item.id === preset.id)) {
      setError("Default presets cannot be deleted.");
      return;
    }

    if (!window.confirm(`Delete the "${preset.name}" preset?`)) return;

    setCustomPresets((previous) =>
      previous.filter((item) => item.id !== preset.id),
    );
    setFavorites((previous) => previous.filter((id) => id !== preset.id));
    setHistory((previous) => previous.filter((item) => item.id !== preset.id));

    if (editingId === preset.id) resetForm();
    if (compareA === preset.id) setCompareA("");
    if (compareB === preset.id) setCompareB("");

    setNotice("Preset deleted.");
  }

  function toggleFavorite(id: string) {
    clearMessages();
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function applyPreset(preset: RoomPreset) {
    clearMessages();

    try {
      onApply(preset);
      setHistory((previous) =>
        [
          {
            id: preset.id,
            name: preset.name,
            appliedAt: new Date().toISOString(),
          },
          ...previous,
        ].slice(0, 100),
      );
      setNotice(`Applied "${preset.name}" to the current room.`);
    } catch {
      setError("Could not apply this preset.");
    }
  }

  function exportCustomPresets() {
    clearMessages();

    const data = JSON.stringify(customPresets, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "interior-ai-room-presets.json";
    anchor.click();

    URL.revokeObjectURL(url);
    setNotice("Custom presets exported.");
  }

  function importCustomPresets(event: ChangeEvent<HTMLInputElement>) {
    clearMessages();

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));

        if (!Array.isArray(parsed)) {
          throw new Error("The file must contain a JSON array.");
        }

        const imported = parsed.filter(isValidPreset);

        if (imported.length === 0) {
          throw new Error("No valid room presets were found in the file.");
        }

        const existingNames = new Set(
          allPresets.map((preset) => preset.name.trim().toLowerCase()),
        );

        const uniqueImported: RoomPreset[] = [];
        for (const preset of imported) {
          const name = preset.name.trim();
          const key = name.toLowerCase();

          if (!name || existingNames.has(key)) continue;

          existingNames.add(key);
          uniqueImported.push({
            id: createId(),
            name,
            width: preset.width,
            depth: preset.depth,
            wallHeight: preset.wallHeight,
          });
        }

        if (uniqueImported.length === 0) {
          throw new Error(
            "All imported preset names already exist or are invalid.",
          );
        }

        setCustomPresets((previous) => [...previous, ...uniqueImported]);
        setNotice(`Imported ${uniqueImported.length} room preset(s).`);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not import the selected JSON file.",
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setError("Could not read the selected file.");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  function clearAllCustomPresets() {
    clearMessages();

    if (customPresets.length === 0) {
      setNotice("There are no custom presets to clear.");
      return;
    }

    if (!window.confirm("Delete all custom room presets? This cannot be undone.")) {
      return;
    }

    const deletedIds = new Set(customPresets.map((preset) => preset.id));

    setCustomPresets([]);
    setFavorites((previous) => previous.filter((id) => !deletedIds.has(id)));
    setHistory((previous) => previous.filter((item) => !deletedIds.has(item.id)));

    if (editingId && deletedIds.has(editingId)) resetForm();
    if (deletedIds.has(compareA)) setCompareA("");
    if (deletedIds.has(compareB)) setCompareB("");

    setNotice("All custom presets have been deleted.");
  }

  function exportHistory() {
    clearMessages();

    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "interior-ai-room-preset-history.json";
    anchor.click();

    URL.revokeObjectURL(url);
    setNotice("Preset usage history exported.");
  }

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.heading}>Room Presets</h2>
        <p style={{ marginTop: 0, fontSize: 13, color: "#475569" }}>
          Save room sizes, apply presets, manage favorites, and compare room
          dimensions before choosing a layout.
        </p>

        <div style={styles.grid}>
          <div>
            <strong>{allPresets.length}</strong>
            <div style={styles.muted}>Total presets</div>
          </div>
          <div>
            <strong>{customPresets.length}</strong>
            <div style={styles.muted}>Custom presets</div>
          </div>
          <div>
            <strong>{favorites.length}</strong>
            <div style={styles.muted}>Favorites</div>
          </div>
          <div>
            <strong>{history.length}</strong>
            <div style={styles.muted}>Recorded applications</div>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" style={styles.success}>
          {notice}
        </div>
      )}

      <section style={styles.section}>
        <h3 style={styles.subheading}>
          {editingId ? "Edit Custom Preset" : "Save Current Room as Preset"}
        </h3>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Preset name</span>
            <input
              style={styles.input}
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="e.g. Study Room"
              maxLength={60}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Width (cm)</span>
            <input
              style={styles.input}
              type="number"
              min="1"
              value={width}
              onChange={(event) => setWidth(event.target.value)}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Depth (cm)</span>
            <input
              style={styles.input}
              type="number"
              min="1"
              value={depth}
              onChange={(event) => setDepth(event.target.value)}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Wall height (cm)</span>
            <input
              style={styles.input}
              type="number"
              min="1"
              value={wallHeight}
              onChange={(event) => setWallHeight(event.target.value)}
            />
          </label>
        </div>

        <div style={{ ...styles.row, marginTop: 12 }}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={savePreset}
          >
            {editingId ? "Update Preset" : "Save Preset"}
          </button>
          <button type="button" style={styles.button} onClick={resetForm}>
            Clear Form
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subheading}>Find and Sort Presets</h3>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Search by name or dimensions</span>
            <input
              style={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search presets..."
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Sort by</span>
            <select
              style={styles.input}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">Name (A–Z)</option>
              <option value="width">Width (smallest first)</option>
              <option value="depth">Depth (smallest first)</option>
              <option value="height">Wall height (smallest first)</option>
              <option value="area">Floor area (smallest first)</option>
              <option value="popular">Most used</option>
            </select>
          </label>
        </div>

        <label style={{ ...styles.row, marginTop: 12, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.target.checked)}
          />
          Show favorites only
        </label>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subheading}>
          Available Presets ({visiblePresets.length})
        </h3>

        {visiblePresets.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>
            No presets match your search. Try another search or turn off the
            favorites filter.
          </p>
        ) : (
          <div style={styles.grid}>
            {visiblePresets.map((preset) => {
              const isFavorite = favorites.includes(preset.id);
              const isDefault = DEFAULT_PRESETS.some(
                (item) => item.id === preset.id,
              );

              return (
                <article key={preset.id} style={styles.card}>
                  <div style={styles.row}>
                    <strong style={{ flex: 1 }}>{preset.name}</strong>
                    <button
                      type="button"
                      style={{
                        ...styles.button,
                        ...(isFavorite ? styles.favorite : {}),
                      }}
                      aria-label={
                        isFavorite
                          ? `Remove ${preset.name} from favorites`
                          : `Add ${preset.name} to favorites`
                      }
                      onClick={() => toggleFavorite(preset.id)}
                    >
                      {isFavorite ? "★ Favorite" : "☆ Favorite"}
                    </button>
                  </div>

                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                    Width: {formatNumber(preset.width)} cm
                    <br />
                    Depth: {formatNumber(preset.depth)} cm
                    <br />
                    Wall height: {formatNumber(preset.wallHeight)} cm
                    <br />
                    Floor area: {formatNumber(getArea(preset))} cm²
                    <br />
                    Estimated volume: {formatNumber(getVolume(preset))} cm³
                  </div>

                  {isDefault && (
                    <span style={styles.muted}>Built-in preset</span>
                  )}

                  <div style={styles.row}>
                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={() => applyPreset(preset)}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => {
                        setCompareA(preset.id);
                        if (compareB === preset.id) setCompareB("");
                        setNotice(`${preset.name} selected for comparison.`);
                        setError("");
                      }}
                    >
                      Compare as A
                    </button>
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => {
                        setCompareB(preset.id);
                        if (compareA === preset.id) setCompareA("");
                        setNotice(`${preset.name} selected for comparison.`);
                        setError("");
                      }}
                    >
                      Compare as B
                    </button>
                  </div>

                  {!isDefault && (
                    <div style={styles.row}>
                      <button
                        type="button"
                        style={styles.button}
                        onClick={() => startEditing(preset)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => deletePreset(preset)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.subheading}>Compare Two Room Presets</h3>
        <p style={{ fontSize: 13, color: "#475569" }}>
          Choose two presets to compare their dimensions, floor area, and
          estimated volume. The area and volume are calculated from the
          dimensions in centimetres.
        </p>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.label}>Room A</span>
            <select
              style={styles.input}
              value={compareA}
              onChange={(event) => setCompareA(event.target.value)}
            >
              <option value="">Select first room</option>
              {allPresets.map((preset) => (
                <option
                  key={preset.id}
                  value={preset.id}
                  disabled={preset.id === compareB}
                >
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Room B</span>
            <select
              style={styles.input}
              value={compareB}
              onChange={(event) => setCompareB(event.target.value)}
            >
              <option value="">Select second room</option>
              {allPresets.map((preset) => (
                <option
                  key={preset.id}
                  value={preset.id}
                  disabled={preset.id === compareA}
                >
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {presetA && presetB ? (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableCell}>Measurement</th>
                  <th style={styles.tableCell}>{presetA.name}</th>
                  <th style={styles.tableCell}>{presetB.name}</th>
                  <th style={styles.tableCell}>Difference (B − A)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tableCell}>Width</td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetA.width)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.width)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.width - presetA.width)} cm
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Depth</td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetA.depth)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.depth)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.depth - presetA.depth)} cm
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Wall height</td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetA.wallHeight)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.wallHeight)} cm
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(presetB.wallHeight - presetA.wallHeight)} cm
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Floor area</td>
                  <td style={styles.tableCell}>
                    {formatNumber(getArea(presetA))} cm²
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(getArea(presetB))} cm²
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(getArea(presetB) - getArea(presetA))} cm²
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Estimated volume</td>
                  <td style={styles.tableCell}>
                    {formatNumber(getVolume(presetA))} cm³
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(getVolume(presetB))} cm³
                  </td>
                  <td style={styles.tableCell}>
                    {formatNumber(getVolume(presetB) - getVolume(presetA))} cm³
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ ...styles.row, marginTop: 12 }}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => applyPreset(presetA)}
              >
                Apply {presetA.name}
              </button>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => applyPreset(presetB)}
              >
                Apply {presetB.name}
              </button>
              <button
                type="button"
                style={styles.button}
                onClick={() => {
                  setCompareA("");
                  setCompareB("");
                }}
              >
                Clear Comparison
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
            Select two different presets to see the comparison table.
          </p>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.subheading}>Import and Export</h3>

        <div style={styles.row}>
          <button
            type="button"
            style={styles.button}
            onClick={exportCustomPresets}
          >
            Export Custom Presets
          </button>

          <label style={styles.button}>
            Import Presets (JSON)
            <input
              type="file"
              accept=".json,application/json"
              onChange={importCustomPresets}
              style={{ display: "none" }}
            />
          </label>

          <button
            type="button"
            style={styles.dangerButton}
            onClick={clearAllCustomPresets}
          >
            Clear All Custom Presets
          </button>
        </div>

        <p style={styles.muted}>
          Imported presets with duplicate names are skipped. Built-in presets
          cannot be overwritten or deleted.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.subheading}>Preset Usage History</h3>

        {history.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>
            No presets have been applied yet. Choose Apply on a preset to start
            recording usage.
          </p>
        ) : (
          <>
            <div style={styles.row}>
              <button
                type="button"
                style={styles.button}
                onClick={exportHistory}
              >
                Export History
              </button>
              <button
                type="button"
                style={styles.dangerButton}
                onClick={() => {
                  if (window.confirm("Clear all preset usage history?")) {
                    setHistory([]);
                    setNotice("Preset usage history cleared.");
                    setError("");
                  }
                }}
              >
                Clear History
              </button>
            </div>

            <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
              {history.slice(0, 10).map((entry, index) => (
                <li key={`${entry.id}-${entry.appliedAt}-${index}`}>
                  <strong>{entry.name}</strong>
                  {" — "}
                  {new Date(entry.appliedAt).toLocaleString()}
                </li>
              ))}
            </ul>
            {history.length > 10 && (
              <p style={styles.muted}>
                Showing the 10 most recent entries out of {history.length}.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
