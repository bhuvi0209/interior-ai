
import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
}

interface FurnitureRoomAssignmentTimelineProps {
  furniture: FurnitureItem[];
}

interface ScheduleTask {
  id: string | number;
  furnitureId?: string | number;
  furnitureIds?: (string | number)[];
  furnitureName?: string;
  destinationRoom?: string;
  room?: string;
  date?: string;
  scheduledDate?: string;
  expectedDate?: string;
  notes?: string;
  status?: string;
  [key: string]: unknown;
}

interface ScheduleData {
  tasks: ScheduleTask[];
  rooms: unknown[];
  [key: string]: unknown;
}

const STORAGE_KEY = "interior-ai-room-assignment-schedule";

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

function FurnitureRoomAssignmentTimeline({
  furniture,
}: FurnitureRoomAssignmentTimelineProps) {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const loadSchedule = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setTasks([]);
        setRooms([]);
        setMessage("No saved assignment schedule was found.");
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setTasks(parsed);
        setRooms([]);
      } else {
        setTasks(Array.isArray(parsed.tasks) ? parsed.tasks : []);
        setRooms(Array.isArray(parsed.rooms) ? parsed.rooms : []);
      }

      setMessage("");
    } catch {
      setTasks([]);
      setRooms([]);
      setMessage("Could not read the saved schedule.");
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const saveSchedule = (
    updatedTasks: ScheduleTask[],
    updatedRooms: unknown[] = rooms,
  ) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let existingData: ScheduleData = {
        tasks: [],
        rooms: updatedRooms,
      };

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          existingData = {
            tasks: parsed,
            rooms: updatedRooms,
          };
        } else {
          existingData = {
            ...parsed,
            tasks: updatedTasks,
            rooms: Array.isArray(parsed.rooms)
              ? parsed.rooms
              : updatedRooms,
          };
        }
      }

      existingData.tasks = updatedTasks;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(existingData),
      );

      setTasks(updatedTasks);
      setRooms(existingData.rooms);
      setMessage("Schedule updated successfully.");
    } catch {
      setMessage("Could not save the schedule.");
    }
  };

  const getTaskDate = (task: ScheduleTask) => {
    return String(
      task.scheduledDate ??
        task.date ??
        task.expectedDate ??
        "",
    ).slice(0, 10);
  };

  const getTaskRoom = (task: ScheduleTask) => {
    return String(task.destinationRoom ?? task.room ?? "Not specified");
  };

  const getTaskFurniture = (task: ScheduleTask) => {
    const ids = Array.isArray(task.furnitureIds)
      ? task.furnitureIds
      : task.furnitureId !== undefined
        ? [task.furnitureId]
        : [];

    const names = ids
      .map((id) => {
        const item = furniture.find(
          (entry) => String(entry.id) === String(id),
        );
        return item?.name;
      })
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");

    return String(task.furnitureName ?? "Furniture not specified");
  };

  const getStatus = (task: ScheduleTask) => {
    const status = String(task.status ?? "Pending");

    return STATUS_OPTIONS.includes(status) ? status : "Pending";
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesStatus =
          filterStatus === "All" ||
          getStatus(task) === filterStatus;

        const matchesDate =
          !filterDate || getTaskDate(task) === filterDate;

        const searchText = search.trim().toLowerCase();

        const matchesSearch =
          !searchText ||
          getTaskFurniture(task).toLowerCase().includes(searchText) ||
          getTaskRoom(task).toLowerCase().includes(searchText) ||
          String(task.notes ?? "").toLowerCase().includes(searchText);

        return matchesStatus && matchesDate && matchesSearch;
      })
      .sort((a, b) =>
        getTaskDate(a).localeCompare(getTaskDate(b)),
      );
  }, [tasks, filterStatus, filterDate, search, furniture]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(
        (task) => getStatus(task) === "Pending",
      ).length,
      inProgress: tasks.filter(
        (task) => getStatus(task) === "In Progress",
      ).length,
      completed: tasks.filter(
        (task) => getStatus(task) === "Completed",
      ).length,
    };
  }, [tasks]);

  const updateTaskStatus = (
    taskId: string | number,
    newStatus: string,
  ) => {
    const updatedTasks = tasks.map((task) =>
      String(task.id) === String(taskId)
        ? { ...task, status: newStatus }
        : task,
    );

    saveSchedule(updatedTasks);
  };

  const deleteTask = (taskId: string | number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this scheduled task?",
    );

    if (!confirmed) return;

    const updatedTasks = tasks.filter(
      (task) => String(task.id) !== String(taskId),
    );

    saveSchedule(updatedTasks);
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Furniture", "Destination Room", "Status", "Notes"],
      ...filteredTasks.map((task) => [
        getTaskDate(task),
        getTaskFurniture(task),
        getTaskRoom(task),
        getStatus(task),
        String(task.notes ?? ""),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-assignment-timeline.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "#15803d";
    if (status === "In Progress") return "#2563eb";
    return "#b45309";
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
  } as const;

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "6px" }}>
            Furniture Room Assignment Timeline
          </h2>
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            View and manage your scheduled room assignment tasks.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={loadSchedule} style={buttonStyle}>
            Refresh
          </button>

          <button onClick={exportCSV} style={buttonStyle}>
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <p style={{ color: "#2563eb", fontSize: "14px" }}>
          {message}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={cardStyle}>
          <p style={statLabel}>Total Tasks</p>
          <h2>{counts.total}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabel}>Pending</p>
          <h2 style={{ color: "#b45309" }}>{counts.pending}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabel}>In Progress</p>
          <h2 style={{ color: "#2563eb" }}>{counts.inProgress}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabel}>Completed</p>
          <h2 style={{ color: "#15803d" }}>{counts.completed}</h2>
        </div>
      </div>

      <section style={{ ...cardStyle, marginBottom: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Filter Timeline</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label style={labelStyle}>
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search furniture or room..."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Status
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Scheduled Date
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <button
          onClick={() => {
            setSearch("");
            setFilterStatus("All");
            setFilterDate("");
          }}
          style={{ ...buttonStyle, marginTop: "12px" }}
        >
          Clear Filters
        </button>
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Scheduled Tasks</h3>

        {filteredTasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "35px 10px",
              color: "#6b7280",
            }}
          >
            <h3>No scheduled tasks found</h3>
            <p>
              Add tasks using the Day 82 Room Assignment Scheduler,
              then click Refresh.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {filteredTasks.map((task) => {
              const status = getStatus(task);

              return (
                <div
                  key={String(task.id)}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderLeft: `5px solid ${getStatusColor(status)}`,
                    borderRadius: "8px",
                    padding: "16px",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "16px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        margin: "0 0 6px",
                      }}
                    >
                      {getTaskDate(task) || "No date specified"}
                    </p>

                    <h4 style={{ margin: "0 0 8px" }}>
                      {getTaskFurniture(task)}
                    </h4>

                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      <strong>Destination:</strong> {getTaskRoom(task)}
                    </p>

                    {task.notes && (
                      <p
                        style={{
                          margin: "6px 0",
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        {String(task.notes)}
                      </p>
                    )}

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        padding: "5px 9px",
                        borderRadius: "20px",
                        background: "#f3f4f6",
                        color: getStatusColor(status),
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: "130px",
                    }}
                  >
                    <select
                      value={status}
                      onChange={(event) =>
                        updateTaskStatus(task.id, event.target.value)
                      }
                      style={inputStyle}
                      aria-label={`Change status for ${getTaskFurniture(task)}`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteTask(task.id)}
                      style={deleteButtonStyle}
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p
        style={{
          marginTop: "16px",
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        This timeline displays the schedule stored by Day 82. Changes
        to task status and deletion are saved in browser storage.
        Refresh the timeline after adding tasks in the scheduler.
        Completing a scheduled task does not automatically change
        the actual room assignment.
      </p>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
} as const;

const deleteButtonStyle = {
  ...buttonStyle,
  background: "#dc2626",
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "9px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
} as const;

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
} as const;

const statLabel = {
  color: "#6b7280",
  fontSize: "13px",
  margin: 0,
} as const;

export default FurnitureRoomAssignmentTimeline;
