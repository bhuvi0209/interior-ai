
import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  visible: boolean;
  locked: boolean;
  width?: number;
  depth?: number;
  height?: number;
  model3D?: string;
}

interface AuditRecord {
  id: string;
  furnitureId: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action: string;
  notes: string;
  timestamp: string;
}

interface Props {
  furniture: FurnitureItem[];
}

const STORAGE_KEY = "interior-ai-room-assignment-audit";

function FurnitureRoomAssignmentAudit({ furniture }: Props) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("All");
  const [selectedFurniture, setSelectedFurniture] = useState("");
  const [previousRoom, setPreviousRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setRecords(parsed.filter(
            (item): item is AuditRecord =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.furnitureId === "string" &&
              typeof item.furnitureName === "string"
          ));
        }
      }
    } catch {
      setMessage("Could not read saved audit history.");
    }
  }, []);

  const saveRecords = (updated: AuditRecord[]) => {
    setRecords(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      setMessage("Could not save audit history. Check browser storage.");
    }
  };

  const addRecord = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const item = furniture.find(
      current => String(current.id) === selectedFurniture
    );

    if (!item || !previousRoom.trim() || !newRoom.trim()) {
      setMessage("Please select furniture and enter both room names.");
      return;
    }

    if (previousRoom.trim().toLowerCase() === newRoom.trim().toLowerCase()) {
      setMessage("Previous room and new room must be different.");
      return;
    }

    const record: AuditRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      furnitureId: String(item.id),
      furnitureName: item.name,
      previousRoom: previousRoom.trim(),
      newRoom: newRoom.trim(),
      action: "Room Assignment Changed",
      notes: notes.trim(),
      timestamp: new Date().toISOString()
    };

    saveRecords([record, ...records]);

    setSelectedFurniture("");
    setPreviousRoom("");
    setNewRoom("");
    setNotes("");
    setMessage("Audit record added successfully.");
  };

  const deleteRecord = (id: string) => {
    if (!window.confirm("Delete this audit record?")) return;

    saveRecords(records.filter(record => record.id !== id));
    setMessage("Audit record deleted.");
  };

  const clearHistory = () => {
    if (!window.confirm("Are you sure you want to delete all audit history?")) {
      return;
    }

    saveRecords([]);
    setMessage("Audit history cleared.");
  };

  const exportCSV = () => {
    const headers = [
      "Furniture",
      "Furniture ID",
      "Previous Room",
      "New Room",
      "Action",
      "Notes",
      "Date"
    ];

    const rows = filteredRecords.map(record => [
      record.furnitureName,
      record.furnitureId,
      record.previousRoom,
      record.newRoom,
      record.action,
      record.notes,
      record.timestamp
    ]);

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-audit.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = [
        record.furnitureName,
        record.previousRoom,
        record.newRoom,
        record.notes
      ].join(" ").toLowerCase().includes(search.toLowerCase());

      const matchesRoom =
        roomFilter === "All" ||
        record.previousRoom === roomFilter ||
        record.newRoom === roomFilter;

      return matchesSearch && matchesRoom;
    });
  }, [records, search, roomFilter]);

  const roomOptions = Array.from(
    new Set(
      records.flatMap(record => [
        record.previousRoom,
        record.newRoom
      ])
    )
  );

  return (
    <div style={styles.container}>
      <h2>Furniture Room Assignment Audit</h2>

      <p style={styles.description}>
        Maintain a searchable history of furniture room assignment changes.
      </p>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <strong>{records.length}</strong>
          <span>Total Changes</span>
        </div>

        <div style={styles.statCard}>
          <strong>{new Set(records.map(r => r.furnitureId)).size}</strong>
          <span>Furniture Tracked</span>
        </div>

        <div style={styles.statCard}>
          <strong>{roomOptions.length}</strong>
          <span>Rooms Involved</span>
        </div>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
          <button
            style={styles.closeButton}
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <h3>Record Assignment Change</h3>

      <form onSubmit={addRecord} style={styles.form}>
        <label style={styles.label}>Select Furniture</label>

        <select
          style={styles.input}
          value={selectedFurniture}
          onChange={event => setSelectedFurniture(event.target.value)}
          required
        >
          <option value="">Choose furniture</option>
          {furniture.map(item => (
            <option key={item.id} value={String(item.id)}>
              {item.name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Previous Room</label>
        <input
          style={styles.input}
          value={previousRoom}
          onChange={event => setPreviousRoom(event.target.value)}
          placeholder="Example: Living Room"
          required
        />

        <label style={styles.label}>New Room</label>
        <input
          style={styles.input}
          value={newRoom}
          onChange={event => setNewRoom(event.target.value)}
          placeholder="Example: Bedroom"
          required
        />

        <label style={styles.label}>Notes (Optional)</label>
        <textarea
          style={styles.input}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Reason for changing the assignment..."
          rows={3}
        />

        <button type="submit" style={styles.primaryButton}>
          Add Audit Record
        </button>
      </form>

      <h3>Assignment Change History</h3>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search furniture, room or notes..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <select
          style={styles.input}
          value={roomFilter}
          onChange={event => setRoomFilter(event.target.value)}
        >
          <option value="All">All Rooms</option>
          {roomOptions.map(room => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.actions}>
        <button onClick={exportCSV} style={styles.secondaryButton}>
          Export CSV
        </button>

        <button onClick={clearHistory} style={styles.dangerButton}>
          Clear History
        </button>
      </div>

      {filteredRecords.length === 0 ? (
        <p style={styles.empty}>No matching audit records found.</p>
      ) : (
        filteredRecords.map(record => (
          <div key={record.id} style={styles.recordCard}>
            <div style={styles.recordHeader}>
              <strong>{record.furnitureName}</strong>

              <button
                style={styles.deleteButton}
                onClick={() => deleteRecord(record.id)}
              >
                Delete
              </button>
            </div>

            <p>
              <span style={styles.roomTag}>{record.previousRoom}</span>
              {" → "}
              <span style={styles.roomTag}>{record.newRoom}</span>
            </p>

            <p style={styles.muted}>{record.action}</p>

            {record.notes && <p>Notes: {record.notes}</p>}

            <small style={styles.muted}>
              {new Date(record.timestamp).toLocaleString()}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    margin: "20px 0",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    color: "#1f2937"
  },
  description: {
    color: "#64748b",
    marginBottom: 20
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 12,
    marginBottom: 24
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 16,
    background: "#f1f5f9",
    borderRadius: 10
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    marginBottom: 28,
    background: "#f8fafc",
    borderRadius: 10
  },
  label: {
    fontWeight: 600,
    fontSize: 14
  },
  input: {
    width: "100%",
    padding: 11,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    boxSizing: "border-box",
    background: "#fff",
    color: "#1f2937"
  },
  primaryButton: {
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  secondaryButton: {
    padding: "10px 16px",
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  dangerButton: {
    padding: "10px 16px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    margin: "14px 0"
  },
  recordCard: {
    padding: 16,
    marginBottom: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 10
  },
  recordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  roomTag: {
    display: "inline-block",
    padding: "5px 9px",
    background: "#e0f2fe",
    color: "#075985",
    borderRadius: 6
  },
  deleteButton: {
    padding: "6px 10px",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },
  closeButton: {
    float: "right",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18
  },
  message: {
    padding: 12,
    marginBottom: 16,
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 8
  },
  muted: {
    color: "#64748b",
    fontSize: 13
  },
  empty: {
    padding: 16,
    color: "#94a3b8",
    textAlign: "center"
  }
};

export default FurnitureRoomAssignmentAudit;
