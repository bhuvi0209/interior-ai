
import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
}

interface FurnitureRoomAssignmentCalendarAnalyticsProps {
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

const STORAGE_KEY = "interior-ai-room-assignment-schedule";

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

function FurnitureRoomAssignmentCalendarAnalytics({
  furniture,
}: FurnitureRoomAssignmentCalendarAnalyticsProps) {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRoom, setFilterRoom] = useState("All");
  const [search, setSearch] = useState("");

  const loadSchedule = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setTasks([]);
        setMessage("No saved schedule found. Add tasks using Day 82.");
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setTasks(parsed as ScheduleTask[]);
      } else if (
        parsed &&
        typeof parsed === "object" &&
        "tasks" in parsed
      ) {
        const data = parsed as { tasks?: unknown };

        setTasks(
          Array.isArray(data.tasks)
            ? (data.tasks as ScheduleTask[])
            : [],
        );
      } else {
        setTasks([]);
      }

      setMessage("");
    } catch {
      setTasks([]);
      setMessage("Could not read the saved schedule.");
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const getTaskDate = (task: ScheduleTask): string => {
    return String(
      task.scheduledDate ?? task.date ?? task.expectedDate ?? "",
    ).slice(0, 10);
  };

  const getTaskStatus = (task: ScheduleTask): string => {
    const status = String(task.status ?? "Pending");
    return STATUS_OPTIONS.includes(status) ? status : "Pending";
  };

  const getTaskRoom = (task: ScheduleTask): string => {
    return String(task.destinationRoom ?? task.room ?? "Not specified");
  };

  const getTaskFurniture = (task: ScheduleTask): string => {
    const ids = Array.isArray(task.furnitureIds)
      ? task.furnitureIds
      : task.furnitureId !== undefined
        ? [task.furnitureId]
        : [];

    const names = ids
      .map((id) =>
        furniture.find(
          (item) => String(item.id) === String(id),
        )?.name,
      )
      .filter((name): name is string => Boolean(name));

    if (names.length > 0) return names.join(", ");

    return String(task.furnitureName ?? "Furniture not specified");
  };

  const today = getLocalDateString(new Date());

  const analytics = useMemo(() => {
    const total = tasks.length;

    const pending = tasks.filter(
      (task) => getTaskStatus(task) === "Pending",
    ).length;

    const inProgress = tasks.filter(
      (task) => getTaskStatus(task) === "In Progress",
    ).length;

    const completed = tasks.filter(
      (task) => getTaskStatus(task) === "Completed",
    ).length;

    const overdue = tasks.filter((task) => {
      const date = getTaskDate(task);

      return (
        date !== "" &&
        date < today &&
        getTaskStatus(task) !== "Completed"
      );
    }).length;

    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    const roomCounts: Record<string, number> = {};

    tasks.forEach((task) => {
      const room = getTaskRoom(task);
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    });

    const monthlyCounts: Record<string, number> = {};

    tasks.forEach((task) => {
      const date = getTaskDate(task);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

      const monthKey = date.slice(0, 7);
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    });

    const monthlyData = Object.entries(monthlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate,
      roomCounts,
      monthlyData,
    };
  }, [tasks, today]);

  const roomNames = useMemo(
    () => Object.keys(analytics.roomCounts).sort(),
    [analytics.roomCounts],
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus =
        filterStatus === "All" ||
        getTaskStatus(task) === filterStatus;

      const matchesRoom =
        filterRoom === "All" || getTaskRoom(task) === filterRoom;

      const matchesSearch =
        !query ||
        getTaskFurniture(task).toLowerCase().includes(query) ||
        getTaskRoom(task).toLowerCase().includes(query) ||
        String(task.notes ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesRoom && matchesSearch;
    });
  }, [tasks, filterStatus, filterRoom, search, furniture]);

  const maxRoomCount = Math.max(
    1,
    ...Object.values(analytics.roomCounts),
  );

  const maxMonthCount = Math.max(
    1,
    ...analytics.monthlyData.map(([, count]) => count),
  );

  const exportCSV = () => {
    const rows = [
      [
        "Scheduled Date",
        "Furniture",
        "Destination Room",
        "Status",
        "Notes",
        "Overdue",
      ],
      ...filteredTasks.map((task) => {
        const date = getTaskDate(task);
        const status = getTaskStatus(task);

        const isOverdue =
          date !== "" && date < today && status !== "Completed";

        return [
          date,
          getTaskFurniture(task),
          getTaskRoom(task),
          status,
          String(task.notes ?? ""),
          isOverdue ? "Yes" : "No",
        ];
      }),
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
    link.download = "room-assignment-calendar-analytics.csv";
    link.click();

    URL.revokeObjectURL(url);
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
            Room Assignment Calendar Analytics
          </h2>
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Understand your scheduled tasks, progress, and room distribution.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={loadSchedule} style={buttonStyle}>
            Refresh Data
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
        <SummaryCard label="Total Tasks" value={analytics.total} />
        <SummaryCard
          label="Pending"
          value={analytics.pending}
          color="#b45309"
        />
        <SummaryCard
          label="In Progress"
          value={analytics.inProgress}
          color="#2563eb"
        />
        <SummaryCard
          label="Completed"
          value={analytics.completed}
          color="#15803d"
        />
        <SummaryCard
          label="Overdue"
          value={analytics.overdue}
          color="#dc2626"
        />
      </div>

      <section style={{ ...cardStyle, marginBottom: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Overall Completion</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "14px",
          }}
        >
          <span>Completed tasks</span>
          <strong>{analytics.completionRate}%</strong>
        </div>

        <div
          style={{
            height: "14px",
            background: "#e5e7eb",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${analytics.completionRate}%`,
              height: "100%",
              background: "#16a34a",
              borderRadius: "20px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ color: "#6b7280", fontSize: "13px" }}>
          {analytics.completed} of {analytics.total} scheduled tasks completed.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Room-wise Task Distribution</h3>

          {roomNames.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No room data available.</p>
          ) : (
            roomNames.map((room) => {
              const count = analytics.roomCounts[room];
              const percentage = (count / maxRoomCount) * 100;

              return (
                <div key={room} style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "14px",
                      marginBottom: "6px",
                    }}
                  >
                    <span>{room}</span>
                    <strong>{count}</strong>
                  </div>

                  <div
                    style={{
                      height: "10px",
                      background: "#e5e7eb",
                      borderRadius: "20px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "#2563eb",
                        borderRadius: "20px",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Monthly Task Distribution</h3>

          {analytics.monthlyData.length === 0 ? (
            <p style={{ color: "#6b7280" }}>
              No tasks with valid dates are available.
            </p>
          ) : (
            analytics.monthlyData.map(([month, count]) => (
              <div key={month} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "14px",
                  }}
                >
                  <span>{formatMonth(month)}</span>
                  <strong>{count}</strong>
                </div>

                <div
                  style={{
                    height: "10px",
                    background: "#e5e7eb",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(count / maxMonthCount) * 100}%`,
                      background: "#7c3aed",
                      borderRadius: "20px",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Scheduled Task Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search furniture, room, notes..."
            style={inputStyle}
          />

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

          <select
            value={filterRoom}
            onChange={(event) => setFilterRoom(event.target.value)}
            style={inputStyle}
          >
            <option value="All">All Rooms</option>
            {roomNames.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>
            No matching scheduled tasks found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "650px",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                  <th style={cellStyle}>Date</th>
                  <th style={cellStyle}>Furniture</th>
                  <th style={cellStyle}>Room</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Due</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task, index) => {
                  const date = getTaskDate(task);
                  const status = getTaskStatus(task);
                  const isOverdue =
                    date !== "" &&
                    date < today &&
                    status !== "Completed";

                  return (
                    <tr key={`${task.id}-${index}`}>
                      <td style={cellStyle}>
                        {date || "No date"}
                      </td>
                      <td style={cellStyle}>
                        {getTaskFurniture(task)}
                      </td>
                      <td style={cellStyle}>
                        {getTaskRoom(task)}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            color:
                              status === "Completed"
                                ? "#15803d"
                                : status === "In Progress"
                                  ? "#2563eb"
                                  : "#b45309",
                            fontWeight: 600,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: isOverdue ? "#dc2626" : "#15803d",
                          fontWeight: 600,
                        }}
                      >
                        {isOverdue ? "Overdue" : "On track"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p
        style={{
          marginTop: "16px",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "#6b7280",
        }}
      >
        Analytics are calculated from the saved Day 82 schedule. Overdue
        means a task has a scheduled date before today and is not marked
        Completed. Refresh after changing tasks in the scheduler or calendar.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color = "#1f2937",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
        {label}
      </p>
      <h2 style={{ color, marginBottom: 0 }}>{value}</h2>
    </div>
  );
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) return monthKey;

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
} as const;

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "9px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
} as const;

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  textAlign: "left" as const,
};

export default FurnitureRoomAssignmentCalendarAnalytics;
