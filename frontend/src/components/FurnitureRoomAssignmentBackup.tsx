
import { useState } from "react";
import type { ChangeEvent } from "react";
import type { FurnitureItem } from "../types/Project";

interface Props {
  furniture: FurnitureItem[];
}

interface BackupData {
  version: number;
  exportedAt?: string;
  rooms: string[];
  assignments: Record<string, string>;
}

const STORAGE_KEY = "interior-ai-room-assignments";

const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
];

function FurnitureRoomAssignmentBackup({ furniture }: Props) {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [isImporting, setIsImporting] = useState(false);

  const showMessage = (
    text: string,
    type: "success" | "error" | "info"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const readCurrentBackup = (): BackupData => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        rooms: DEFAULT_ROOMS,
        assignments: {},
      };
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.rooms) ||
      !parsed.assignments ||
      typeof parsed.assignments !== "object" ||
      Array.isArray(parsed.assignments)
    ) {
      throw new Error("Your saved room assignment data is invalid.");
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      rooms: parsed.rooms.filter(
        (room: unknown): room is string =>
          typeof room === "string" && room.trim().length > 0
      ),
      assignments: parsed.assignments as Record<string, string>,
    };
  };

  const exportBackup = () => {
    try {
      const backup = readCurrentBackup();

      const validAssignments: Record<string, string> = {};

      furniture.forEach((item) => {
        const room = backup.assignments[String(item.id)];

        if (typeof room === "string" && room.trim()) {
          validAssignments[String(item.id)] = room;
        }
      });

      const exportData: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        rooms: backup.rooms,
        assignments: validAssignments,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `interior-ai-room-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      showMessage("Room assignment backup downloaded successfully.", "success");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to export the backup.",
        "error"
      );
    }
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsImporting(true);
    showMessage("Checking your backup file...", "info");

    try {
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Please select a JSON backup file.");
      }

      const fileText = await file.text();
      const parsed = JSON.parse(fileText);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray(parsed.rooms) ||
        !parsed.assignments ||
        typeof parsed.assignments !== "object" ||
        Array.isArray(parsed.assignments)
      ) {
        throw new Error("Invalid backup file. Required data is missing.");
      }

      const validRooms = parsed.rooms.filter(
        (room: unknown): room is string =>
          typeof room === "string" && room.trim().length > 0
      );

      if (validRooms.length === 0) {
        throw new Error("The backup does not contain any valid room names.");
      }

      const roomSet = new Set(validRooms);
      const validAssignments: Record<string, string> = {};

      Object.entries(parsed.assignments).forEach(([id, room]) => {
        if (
          typeof room === "string" &&
          roomSet.has(room) &&
          furniture.some((item) => String(item.id) === id)
        ) {
          validAssignments[id] = room;
        }
      });

      const backup: BackupData = {
        version: 1,
        exportedAt:
          typeof parsed.exportedAt === "string"
            ? parsed.exportedAt
            : new Date().toISOString(),
        rooms: Array.from(new Set(validRooms)),
        assignments: validAssignments,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));

      showMessage(
        "Backup imported successfully. Refresh the page to see the restored room assignments.",
        "success"
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to import the backup file.",
        "error"
      );
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const assignedCount = furniture.filter((item) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      const room = parsed?.assignments?.[String(item.id)];

      return typeof room === "string" && room.trim() !== "";
    } catch {
      return false;
    }
  }).length;

  const messageColors = {
    success: "#166534",
    error: "#b91c1c",
    info: "#1d4ed8",
  };

  const messageBackgrounds = {
    success: "#dcfce7",
    error: "#fee2e2",
    info: "#dbeafe",
  };

  return (
    <section
      style={{
        padding: "24px",
        margin: "20px 0",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        color: "#1f2937",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Furniture Room Assignment Backup
      </h2>

      <p style={{ color: "#6b7280" }}>
        Save your room names and furniture assignments in a JSON file.
        You can import the file later to restore your assignments.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            padding: "16px",
            background: "#eff6ff",
            borderRadius: "10px",
          }}
        >
          <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>
            Total Furniture
          </p>
          <h2 style={{ marginBottom: 0 }}>{furniture.length}</h2>
        </div>

        <div
          style={{
            padding: "16px",
            background: "#f0fdf4",
            borderRadius: "10px",
          }}
        >
          <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>
            Currently Assigned
          </p>
          <h2 style={{ marginBottom: 0 }}>{assignedCount}</h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <button
          type="button"
          onClick={exportBackup}
          style={{
            padding: "12px 18px",
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Download JSON Backup
        </button>

        <label
          style={{
            display: "inline-block",
            padding: "12px 18px",
            background: isImporting ? "#9ca3af" : "#16a34a",
            color: "#ffffff",
            borderRadius: "8px",
            cursor: isImporting ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isImporting ? "Importing..." : "Import JSON Backup"}

          <input
            type="file"
            accept=".json,application/json"
            onChange={importBackup}
            disabled={isImporting}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {message && (
        <div
          role="status"
          style={{
            marginTop: "18px",
            padding: "12px",
            borderRadius: "8px",
            color: messageColors[messageType],
            background: messageBackgrounds[messageType],
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "14px",
          background: "#f9fafb",
          borderRadius: "8px",
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        <strong>Important:</strong> Importing a backup replaces your currently
        saved room assignments. Export a backup first if you want to keep
        a copy of your current data. Furniture IDs must match the current
        project for assignments to be restored.
      </div>
    </section>
  );
}

export default FurnitureRoomAssignmentBackup;
