
import { useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureMaintenanceTrackerProps {
  furniture: FurnitureItem[];
}

type MaintenanceStatus = "Pending" | "Completed";

interface MaintenanceTask {
  id: string;
  furnitureId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MaintenanceStatus;
  createdAt: string;
}

const STORAGE_KEY = "interior-ai-day71-maintenance";

function loadTasks(): MaintenanceTask[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.furnitureId === "string" &&
            typeof task.title === "string" &&
            typeof task.dueDate === "string" &&
            (task.status === "Pending" ||
              task.status === "Completed")
        );
      }
    }
  } catch {
    // Start with an empty task list if saved data is unavailable.
  }

  return [];
}

function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(date: string): string {
  if (!date) return "No date";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTaskStatus(task: MaintenanceTask): string {
  if (task.status === "Completed") {
    return "Completed";
  }

  if (task.dueDate < getToday()) {
    return "Overdue";
  }

  if (task.dueDate === getToday()) {
    return "Due Today";
  }

  return "Pending";
}

export default function FurnitureMaintenanceTracker({
  furniture,
}: FurnitureMaintenanceTrackerProps) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(loadTasks);

  const [furnitureId, setFurnitureId] = useState(
    furniture.length > 0 ? String(furniture[0].id) : ""
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getToday());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Tasks remain available while the page is open.
    }
  }, [tasks]);

  const furnitureNames = useMemo(() => {
    return new Map(
      furniture.map((item) => [String(item.id), item.name])
    );
  }, [furniture]);

  const taskCounts = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(
        (task) => getTaskStatus(task) === "Completed"
      ).length,
      overdue: tasks.filter(
        (task) => getTaskStatus(task) === "Overdue"
      ).length,
      pending: tasks.filter(
        (task) =>
          getTaskStatus(task) === "Pending" ||
          getTaskStatus(task) === "Due Today"
      ).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const status = getTaskStatus(task);

      if (filter === "All") return true;
      if (filter === "Pending") {
        return status === "Pending" || status === "Due Today";
      }

      return status === filter;
    });

    return [...filtered].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
  }, [tasks, filter]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDueDate(getToday());
    setFurnitureId(
      furniture.length > 0 ? String(furniture[0].id) : ""
    );
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!furnitureId) {
      setError("Please select a furniture item.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a maintenance task name.");
      return;
    }

    if (!dueDate) {
      setError("Please select a maintenance date.");
      return;
    }

    const selectedFurnitureExists = furniture.some(
      (item) => String(item.id) === furnitureId
    );

    if (!selectedFurnitureExists) {
      setError("The selected furniture item is no longer available.");
      return;
    }

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                furnitureId,
                title: title.trim(),
                description: description.trim(),
                dueDate,
              }
            : task
        )
      );
    } else {
      const newTask: MaintenanceTask = {
        id: createId(),
        furnitureId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };

      setTasks((current) => [...current, newTask]);
    }

    resetForm();
  }

  function editTask(task: MaintenanceTask) {
    setEditingId(task.id);
    setFurnitureId(task.furnitureId);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toggleComplete(task: MaintenanceTask) {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status:
                item.status === "Completed"
                  ? "Pending"
                  : "Completed",
            }
          : item
      )
    );
  }

  function deleteTask(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this maintenance task?"
    );

    if (!confirmed) return;

    setTasks((current) =>
      current.filter((task) => task.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  function exportCsv() {
    const rows = [
      [
        "Furniture",
        "Maintenance Task",
        "Description",
        "Due Date",
        "Status",
      ],
      ...tasks.map((task) => [
        furnitureNames.get(task.furnitureId) || "Furniture removed",
        task.title,
        task.description,
        task.dueDate,
        getTaskStatus(task),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-maintenance-tasks.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const styles = {
    panel: {
      padding: "24px",
      margin: "20px 0",
      border: "1px solid #d9dce3",
      borderRadius: "14px",
      background: "#ffffff",
      color: "#20232a",
      fontFamily: "Arial, sans-serif",
    } as const,
    input: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "11px 12px",
      border: "1px solid #cbd0d9",
      borderRadius: "8px",
      fontSize: "14px",
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "8px",
      background: "#242b3a",
      color: "#ffffff",
      fontWeight: 600,
      cursor: "pointer",
    } as const,
    card: {
      padding: "15px",
      border: "1px solid #e1e4ea",
      borderRadius: "10px",
    } as const,
  };

  function statusColor(status: string) {
    switch (status) {
      case "Completed":
        return "#247342";
      case "Overdue":
        return "#c62828";
      case "Due Today":
        return "#a56800";
      default:
        return "#5265a8";
    }
  }

  return (
    <section style={styles.panel}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>
            Furniture Maintenance Tracker
          </h2>

          <p style={{ margin: 0, color: "#666b76", fontSize: "14px" }}>
            Plan furniture care and keep track of maintenance tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          style={styles.button}
          disabled={tasks.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Total tasks
          </p>
          <strong style={{ fontSize: "23px" }}>
            {taskCounts.total}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Pending
          </p>
          <strong style={{ fontSize: "23px", color: "#5265a8" }}>
            {taskCounts.pending}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Overdue
          </p>
          <strong style={{ fontSize: "23px", color: "#c62828" }}>
            {taskCounts.overdue}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Completed
          </p>
          <strong style={{ fontSize: "23px", color: "#247342" }}>
            {taskCounts.completed}
          </strong>
        </div>
      </div>

      {/* Add or edit task form */}

      <div
        style={{
          padding: "18px",
          background: "#f7f8fa",
          borderRadius: "10px",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editingId ? "Edit Maintenance Task" : "Add Maintenance Task"}
        </h3>

        {furniture.length === 0 ? (
          <p style={{ color: "#666b76" }}>
            Add furniture to your project before creating maintenance tasks.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <label
                  htmlFor="day71-furniture"
                  style={{ display: "block", fontWeight: 600, marginBottom: "7px" }}
                >
                  Select furniture
                </label>

                <select
                  id="day71-furniture"
                  value={furnitureId}
                  onChange={(event) => setFurnitureId(event.target.value)}
                  style={styles.input}
                  required
                >
                  {furniture.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="day71-title"
                  style={{ display: "block", fontWeight: 600, marginBottom: "7px" }}
                >
                  Maintenance task
                </label>

                <input
                  id="day71-title"
                  type="text"
                  placeholder="Example: Clean sofa"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  style={styles.input}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="day71-date"
                  style={{ display: "block", fontWeight: 600, marginBottom: "7px" }}
                >
                  Due date
                </label>

                <input
                  id="day71-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: "14px" }}>
              <label
                htmlFor="day71-description"
                style={{ display: "block", fontWeight: 600, marginBottom: "7px" }}
              >
                Description (optional)
              </label>

              <textarea
                id="day71-description"
                placeholder="Add notes about this maintenance task..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={500}
                style={{
                  ...styles.input,
                  resize: "vertical",
                }}
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{ color: "#c62828", fontSize: "14px" }}
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button type="submit" style={styles.button}>
                {editingId ? "Update Task" : "Add Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    ...styles.button,
                    background: "#697386",
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Task list */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0 }}>Maintenance Schedule</h3>

        <select
          aria-label="Filter maintenance tasks"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{
            ...styles.input,
            width: "auto",
            minWidth: "150px",
          }}
        >
          <option value="All">All Tasks</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div
          style={{
            padding: "25px",
            textAlign: "center",
            background: "#f7f8fa",
            borderRadius: "10px",
            color: "#666b76",
          }}
        >
          No maintenance tasks found.
          <p style={{ marginBottom: 0, fontSize: "13px" }}>
            Add a task above to start your maintenance schedule.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredTasks.map((task) => {
            const status = getTaskStatus(task);
            const color = statusColor(status);

            return (
              <article
                key={task.id}
                style={{
                  padding: "16px",
                  border: "1px solid #e1e4ea",
                  borderRadius: "10px",
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <h4 style={{ margin: "0 0 7px" }}>
                      {task.title}
                    </h4>

                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#666b76",
                        fontSize: "13px",
                      }}
                    >
                      Furniture:{" "}
                      {furnitureNames.get(task.furnitureId) ||
                        "Furniture removed from project"}
                    </p>

                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#666b76",
                        fontSize: "13px",
                      }}
                    >
                      Due date: {formatDate(task.dueDate)}
                    </p>

                    {task.description && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "20px",
                      background: `${color}18`,
                      color,
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "15px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleComplete(task)}
                    style={{
                      ...styles.button,
                      background:
                        task.status === "Completed"
                          ? "#697386"
                          : "#247342",
                    }}
                  >
                    {task.status === "Completed"
                      ? "Mark Pending"
                      : "Mark Completed"}
                  </button>

                  <button
                    type="button"
                    onClick={() => editTask(task)}
                    style={{
                      ...styles.button,
                      background: "#5265a8",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    style={{
                      ...styles.button,
                      background: "#c62828",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p
        style={{
          marginTop: "22px",
          color: "#666b76",
          fontSize: "12px",
        }}
      >
        Maintenance tasks are saved in this browser. Export your CSV to keep
        an additional copy of your schedule.
      </p>
    </section>
  );
}
