
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { FurnitureItem } from "../types/Project";

interface Props {
  furniture: FurnitureItem[];
}

type TaskStatus = "Pending" | "In Progress" | "Completed";

interface AssignmentTask {
  id: string;
  furnitureId: string;
  furnitureName: string;
  room: string;
  plannedDate: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "interior-ai-room-assignment-schedule";

const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
];

function FurnitureRoomAssignmentScheduler({ furniture }: Props) {
  const [tasks, setTasks] = useState<AssignmentTask[]>([]);
  const [rooms, setRooms] = useState<string[]>(DEFAULT_ROOMS);
  const [message, setMessage] = useState("");

  const [furnitureId, setFurnitureId] = useState("");
  const [room, setRoom] = useState(DEFAULT_ROOMS[0]);
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed.tasks)) {
          const validTasks = parsed.tasks.filter(
            (task: AssignmentTask) =>
              task &&
              typeof task.id === "string" &&
              typeof task.furnitureId === "string" &&
              typeof task.furnitureName === "string" &&
              typeof task.room === "string" &&
              typeof task.plannedDate === "string" &&
              ["Pending", "In Progress", "Completed"].includes(task.status)
          );

          setTasks(validTasks);
        }

        if (Array.isArray(parsed.rooms)) {
          const validRooms = parsed.rooms.filter(
            (value: unknown): value is string =>
              typeof value === "string" && value.trim() !== ""
          );

          setRooms(Array.from(new Set([...DEFAULT_ROOMS, ...validRooms])));
        }
      }
    } catch {
      setMessage("Could not load saved schedule data.");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tasks, rooms })
      );
    } catch {
      setMessage("Could not save schedule data.");
    }
  }, [tasks, rooms]);



  const resetForm = () => {
    setFurnitureId("");
    setRoom(rooms[0] || DEFAULT_ROOMS[0]);
    setPlannedDate("");
    setNotes("");
    setEditingId(null);
  };

  const saveTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!furnitureId || !room || !plannedDate) {
      setMessage("Please select furniture, a room, and a planned date.");
      return;
    }

    const item = furniture.find(
      (entry) => String(entry.id) === furnitureId
    );

    if (!item) {
      setMessage("The selected furniture item no longer exists.");
      return;
    }

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                furnitureId,
                furnitureName: String(item.name || "Unnamed Furniture"),
                room,
                plannedDate,
                notes,
              }
            : task
        )
      );

      setMessage("Assignment task updated.");
    } else {
      const newTask: AssignmentTask = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        furnitureId,
        furnitureName: String(item.name || "Unnamed Furniture"),
        room,
        plannedDate,
        status: "Pending",
        notes,
        createdAt: new Date().toISOString(),
      };

      setTasks((current) => [newTask, ...current]);
      setMessage("Assignment task added.");
    }

    resetForm();
  };

  const editTask = (task: AssignmentTask) => {
    setEditingId(task.id);
    setFurnitureId(task.furnitureId);
    setRoom(task.room);
    setPlannedDate(task.plannedDate);
    setNotes(task.notes || "");
    setMessage("Editing selected task.");
  };

  const deleteTask = (id: string) => {
    if (!window.confirm("Delete this assignment task?")) return;

    setTasks((current) => current.filter((task) => task.id !== id));

    if (editingId === id) resetForm();

    setMessage("Assignment task deleted.");
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );

    setMessage("Task status updated.");
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        task.furnitureName.toLowerCase().includes(query) ||
        task.room.toLowerCase().includes(query) ||
        task.notes.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const pendingCount = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const progressCount = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const exportCSV = () => {
    if (tasks.length === 0) {
      setMessage("There are no tasks to export.");
      return;
    }

    const headers = [
      "Furniture",
      "Room",
      "Planned Date",
      "Status",
      "Notes",
    ];

    const rows = tasks.map((task) => [
      task.furnitureName,
      task.room,
      task.plannedDate,
      task.status,
      task.notes,
    ]);

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-assignment-schedule.csv";
    link.click();

    URL.revokeObjectURL(url);
    setMessage("Schedule exported successfully.");
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 13px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginTop: "6px",
  };

  const statusColors: Record<TaskStatus, string> = {
    Pending: "#d97706",
    "In Progress": "#2563eb",
    Completed: "#16a34a",
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
        Furniture Room Assignment Scheduler
      </h2>

      <p style={{ color: "#6b7280" }}>
        Plan furniture room assignments and track their completion.
      </p>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        {[
          { label: "Total Tasks", value: tasks.length, color: "#2563eb" },
          { label: "Pending", value: pendingCount, color: "#d97706" },
          { label: "In Progress", value: progressCount, color: "#2563eb" },
          { label: "Completed", value: completedCount, color: "#16a34a" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: "16px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
            }}
          >
            <span style={{ color: "#6b7280", fontSize: "13px" }}>
              {card.label}
            </span>
            <h2 style={{ marginBottom: 0, color: card.color }}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Add or edit task */}
      <h3>{editingId ? "Edit Assignment Task" : "Add Assignment Task"}</h3>

      {furniture.length === 0 ? (
        <p style={{ color: "#b45309" }}>
          Add furniture to your project before creating assignment tasks.
        </p>
      ) : (
        <form
          onSubmit={saveTask}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            padding: "18px",
            background: "#f9fafb",
            borderRadius: "10px",
          }}
        >
          <label>
            Furniture
            <select
              value={furnitureId}
              onChange={(event) => setFurnitureId(event.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Select furniture</option>
              {furniture.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination Room
            <select
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              required
              style={inputStyle}
            >
              {rooms.map((roomName) => (
                <option key={roomName} value={roomName}>
                  {roomName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Planned Date
            <input
              type="date"
              value={plannedDate}
              onChange={(event) => setPlannedDate(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add assignment details..."
              rows={3}
              style={inputStyle}
            />
          </label>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              gridColumn: "1 / -1",
            }}
          >
            <button
              type="submit"
              style={{
                ...buttonStyle,
                background: "#2563eb",
                color: "#ffffff",
              }}
            >
              {editingId ? "Update Task" : "Add Task"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...buttonStyle,
                  background: "#e5e7eb",
                  color: "#374151",
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: "14px",
            padding: "10px",
            background: "#eff6ff",
            color: "#1d4ed8",
            borderRadius: "7px",
          }}
        >
          {message}
        </p>
      )}

      {/* Filters */}
      <h3 style={{ marginTop: "28px" }}>Assignment Schedule</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search furniture, room or notes..."
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={inputStyle}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <button
        type="button"
        onClick={exportCSV}
        style={{
          ...buttonStyle,
          background: "#16a34a",
          color: "#ffffff",
          marginBottom: "16px",
        }}
      >
        Export Schedule CSV
      </button>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>
          No assignment tasks found. Add a task to get started.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{task.furnitureName}</strong>

                  <p style={{ margin: "7px 0" }}>
                    Destination: {task.room}
                  </p>

                  <p style={{ margin: "7px 0", color: "#6b7280" }}>
                    Planned date: {task.plannedDate}
                  </p>

                  {task.notes && (
                    <p style={{ color: "#6b7280" }}>
                      Notes: {task.notes}
                    </p>
                  )}

                  <strong style={{ color: statusColors[task.status] }}>
                    {task.status}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <select
                    value={task.status}
                    onChange={(event) =>
                      updateStatus(
                        task.id,
                        event.target.value as TaskStatus
                      )
                    }
                    style={{
                      padding: "8px",
                      borderRadius: "7px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => editTask(task)}
                    style={{
                      ...buttonStyle,
                      background: "#dbeafe",
                      color: "#1d4ed8",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    style={{
                      ...buttonStyle,
                      background: "#fee2e2",
                      color: "#b91c1c",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default FurnitureRoomAssignmentScheduler;
