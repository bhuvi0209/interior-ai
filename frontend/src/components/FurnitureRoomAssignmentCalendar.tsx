import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
}

interface FurnitureRoomAssignmentCalendarProps {
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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function FurnitureRoomAssignmentCalendar({
  furniture,
}: FurnitureRoomAssignmentCalendarProps) {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date()),
  );
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [message, setMessage] = useState("");

  function loadSchedule() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setTasks([]);
        setRooms([]);
        setMessage("No saved schedule found. Add tasks in the Day 82 scheduler.");
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setTasks(parsed as ScheduleTask[]);
        setRooms([]);
      } else if (
        parsed &&
        typeof parsed === "object" &&
        "tasks" in parsed
      ) {
        const data = parsed as {
          tasks?: unknown;
          rooms?: unknown;
        };

        setTasks(
          Array.isArray(data.tasks)
            ? (data.tasks as ScheduleTask[])
            : [],
        );
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      } else {
        setTasks([]);
        setRooms([]);
      }

      setMessage("");
    } catch {
      setTasks([]);
      setRooms([]);
      setMessage("Could not read the saved schedule.");
    }
  }

  useEffect(() => {
    loadSchedule();
  }, []);

  function saveTasks(updatedTasks: ScheduleTask[]) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let updatedData: Record<string, unknown> = {
        tasks: updatedTasks,
        rooms,
      };

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          updatedData = {
            ...(parsed as Record<string, unknown>),
            tasks: updatedTasks,
          };
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setTasks(updatedTasks);
      setMessage("Schedule updated successfully.");
    } catch {
      setMessage("Could not save the schedule.");
    }
  }

  function getTaskDate(task: ScheduleTask): string {
    const rawDate =
      task.scheduledDate ?? task.date ?? task.expectedDate ?? "";

    return String(rawDate).slice(0, 10);
  }

  function getTaskStatus(task: ScheduleTask): string {
    const status = String(task.status ?? "Pending");

    return STATUS_OPTIONS.includes(status) ? status : "Pending";
  }

  function getTaskRoom(task: ScheduleTask): string {
    return String(
      task.destinationRoom ?? task.room ?? "Not specified",
    );
  }

  function getTaskFurniture(task: ScheduleTask): string {
    const ids = Array.isArray(task.furnitureIds)
      ? task.furnitureIds
      : task.furnitureId !== undefined
        ? [task.furnitureId]
        : [];

    const names = ids
      .map((id) =>
        furniture.find((item) => String(item.id) === String(id))?.name,
      )
      .filter((name): name is string => Boolean(name));

    if (names.length > 0) {
      return names.join(", ");
    }

    return String(task.furnitureName ?? "Furniture not specified");
  }

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, ScheduleTask[]> = {};

    tasks.forEach((task) => {
      const date = getTaskDate(task);

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return;
      }

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(task);
    });

    return grouped;
  }, [tasks]);

  const selectedTasks = tasksByDate[selectedDate] ?? [];

  const monthCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(
        (task) => getTaskStatus(task) === "Pending",
      ).length,
      inProgress: tasks.filter(
        (task) => getTaskStatus(task) === "In Progress",
      ).length,
      completed: tasks.filter(
        (task) => getTaskStatus(task) === "Completed",
      ).length,
    };
  }, [tasks]);

  function changeMonth(amount: number) {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1,
        ),
    );
  }

  function updateTaskStatus(
    taskId: string | number,
    status: string,
  ) {
    const updatedTasks = tasks.map((task) =>
      String(task.id) === String(taskId)
        ? { ...task, status }
        : task,
    );

    saveTasks(updatedTasks);
  }

  function deleteTask(taskId: string | number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this scheduled task?",
    );

    if (!confirmed) return;

    const updatedTasks = tasks.filter(
      (task) => String(task.id) !== String(taskId),
    );

    saveTasks(updatedTasks);
  }

  function exportCSV() {
    const rows = [
      ["Date", "Furniture", "Destination Room", "Status", "Notes"],
      ...tasks.map((task) => [
        getTaskDate(task),
        getTaskFurniture(task),
        getTaskRoom(task),
        getTaskStatus(task),
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
    link.download = "furniture-room-assignment-calendar.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function getStatusColor(status: string): string {
    if (status === "Completed") return "#15803d";
    if (status === "In Progress") return "#2563eb";
    return "#b45309";
  }

  const todayString = getLocalDateString(new Date());

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
            Furniture Room Assignment Calendar
          </h2>
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            View your scheduled furniture assignments by date.
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
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <SummaryCard label="Total Tasks" value={summary.total} />
        <SummaryCard
          label="Pending"
          value={summary.pending}
          color="#b45309"
        />
        <SummaryCard
          label="In Progress"
          value={summary.inProgress}
          color="#2563eb"
        />
        <SummaryCard
          label="Completed"
          value={summary.completed}
          color="#15803d"
        />
      </div>

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={navigationButtonStyle}
            aria-label="Previous month"
          >
            ← Previous
          </button>

          <h3 style={{ margin: 0 }}>
            {MONTH_NAMES[visibleMonth.getMonth()]}{" "}
            {visibleMonth.getFullYear()}
          </h3>

          <button
            onClick={() => changeMonth(1)}
            style={navigationButtonStyle}
            aria-label="Next month"
          >
            Next →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: "5px",
          }}
        >
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                padding: "9px 2px",
                fontWeight: 700,
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              {day}
            </div>
          ))}

          {monthCells.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{ minHeight: "75px" }}
                />
              );
            }

            const date = getLocalDateString(
              new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                day,
              ),
            );

            const dayTasks = tasksByDate[date] ?? [];
            const isSelected = selectedDate === date;
            const isToday = todayString === date;

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                style={{
                  minWidth: 0,
                  minHeight: "75px",
                  padding: "7px 4px",
                  border: isSelected
                    ? "2px solid #2563eb"
                    : isToday
                      ? "2px solid #93c5fd"
                      : "1px solid #e5e7eb",
                  borderRadius: "7px",
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "center",
                  color: "#1f2937",
                }}
              >
                <div
                  style={{
                    fontWeight: isToday || isSelected ? 700 : 400,
                  }}
                >
                  {day}
                </div>

                {dayTasks.length > 0 && (
                  <div
                    style={{
                      marginTop: "7px",
                      display: "flex",
                      justifyContent: "center",
                      gap: "3px",
                      flexWrap: "wrap",
                    }}
                  >
                    {dayTasks.slice(0, 4).map((task, taskIndex) => (
                      <span
                        key={`${task.id}-${taskIndex}`}
                        title={getTaskStatus(task)}
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: getStatusColor(
                            getTaskStatus(task),
                          ),
                        }}
                      />
                    ))}
                  </div>
                )}

                {dayTasks.length > 0 && (
                  <small
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#6b7280",
                      fontSize: "10px",
                    }}
                  >
                    {dayTasks.length} task
                    {dayTasks.length === 1 ? "" : "s"}
                  </small>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            marginTop: "16px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <Legend color="#b45309" label="Pending" />
          <Legend color="#2563eb" label="In Progress" />
          <Legend color="#15803d" label="Completed" />
          <span>Blue border = Today or selected date</span>
        </div>
      </section>

      <section style={{ ...sectionStyle, marginTop: "20px" }}>
        <h3 style={{ marginTop: 0 }}>
          Tasks for {formatDate(selectedDate)}
        </h3>

        {selectedTasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "18px 0" }}>
            No tasks scheduled for this date.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {selectedTasks.map((task, index) => {
              const status = getTaskStatus(task);

              return (
                <div
                  key={`${task.id}-${index}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderLeft: `5px solid ${getStatusColor(status)}`,
                    borderRadius: "8px",
                    padding: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div style={{ flex: "1 1 220px" }}>
                    <h4 style={{ margin: "0 0 8px" }}>
                      {getTaskFurniture(task)}
                    </h4>

                    <p style={{ margin: "4px 0", fontSize: "14px" }}>
                      <strong>Destination:</strong> {getTaskRoom(task)}
                    </p>

                    {task.notes && (
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                          margin: "6px 0",
                        }}
                      >
                        {String(task.notes)}
                      </p>
                    )}

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
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
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <select
                      value={status}
                      onChange={(event) =>
                        updateTaskStatus(task.id, event.target.value)
                      }
                      style={inputStyle}
                      aria-label="Change task status"
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
                      Delete
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
          color: "#6b7280",
          fontSize: "13px",
          lineHeight: 1.5,
          marginTop: "16px",
        }}
      >
        The calendar reads the Day 82 schedule stored in your browser.
        Click Refresh after adding tasks in the scheduler. Changing a
        task's status here updates the saved schedule, but does not
        automatically change the actual room assignment.
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
    <div style={sectionStyle}>
      <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
        {label}
      </p>
      <h2 style={{ color, marginBottom: 0 }}>{value}</h2>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </span>
  );
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return dateString;

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const sectionStyle = {
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

const navigationButtonStyle = {
  ...buttonStyle,
  background: "#374151",
} as const;

const deleteButtonStyle = {
  ...buttonStyle,
  background: "#dc2626",
} as const;

const inputStyle = {
  padding: "9px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
} as const;

export default FurnitureRoomAssignmentCalendar;