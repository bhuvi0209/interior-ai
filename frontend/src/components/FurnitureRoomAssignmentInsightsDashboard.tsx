
import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width?: number;
  depth?: number;
  height?: number;
  model3D?: string;
  visible: boolean;
  locked: boolean;
}

interface Props {
  furniture: FurnitureItem[];
}

interface Assignment {
  furnitureId: string;
  room: string;
}

interface ScheduleTask {
  id?: string | number;
  title?: string;
  furnitureId?: string | number;
  furnitureIds?: Array<string | number>;
  furnitureName?: string;
  destinationRoom?: string;
  room?: string;
  scheduledDate?: string;
  date?: string;
  status?: string;
  notes?: string;
}

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const SCHEDULE_KEY = "interior-ai-room-assignment-schedule";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const buttonStyle = {
  border: "none",
  borderRadius: "7px",
  padding: "9px 14px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600 as const,
};

function readJson(key: string): unknown {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function getAssignments(data: unknown): Assignment[] {
  if (!data) return [];

  const source =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>).assignments ?? data
      : data;

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const furnitureId =
          record.furnitureId ?? record.itemId ?? record.id;
        const room =
          record.room ?? record.roomName ?? record.assignedRoom;

        if (furnitureId == null || typeof room !== "string" || !room.trim()) {
          return null;
        }

        return {
          furnitureId: String(furnitureId),
          room: room.trim(),
        };
      })
      .filter((item): item is Assignment => item !== null);
  }

  if (typeof source === "object" && source !== null) {
    return Object.entries(source as Record<string, unknown>)
      .map(([furnitureId, value]) => {
        if (typeof value === "string") {
          return { furnitureId, room: value.trim() };
        }

        if (value && typeof value === "object") {
          const record = value as Record<string, unknown>;
          const room =
            record.room ?? record.roomName ?? record.assignedRoom;

          if (typeof room === "string") {
            return { furnitureId, room: room.trim() };
          }
        }

        return null;
      })
      .filter(
        (item): item is Assignment =>
          item !== null && item.room.length > 0
      );
  }

  return [];
}

function getTasks(data: unknown): ScheduleTask[] {
  if (Array.isArray(data)) return data as ScheduleTask[];

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.tasks)) return record.tasks as ScheduleTask[];
    if (Array.isArray(record.schedule)) {
      return record.schedule as ScheduleTask[];
    }
  }

  return [];
}

function normalizeStatus(status?: string): string {
  return String(status ?? "Pending").trim().toLowerCase();
}

function getTaskDate(task: ScheduleTask): string {
  return String(task.scheduledDate ?? task.date ?? "").slice(0, 10);
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function FurnitureRoomAssignmentInsightsDashboard({
  furniture,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roomFilter, setRoomFilter] = useState("All");

  const refreshData = () => {
    setAssignments(getAssignments(readJson(ASSIGNMENT_KEY)));
    setTasks(getTasks(readJson(SCHEDULE_KEY)));
  };

  useEffect(() => {
    refreshData();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === ASSIGNMENT_KEY ||
        event.key === SCHEDULE_KEY ||
        event.key === null
      ) {
        refreshData();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const furnitureIds = useMemo(
    () => new Set(furniture.map((item) => String(item.id))),
    [furniture]
  );

  const validAssignments = useMemo(
    () =>
      assignments.filter((assignment) =>
        furnitureIds.has(assignment.furnitureId)
      ),
    [assignments, furnitureIds]
  );

  const assignedIds = useMemo(
    () => new Set(validAssignments.map((item) => item.furnitureId)),
    [validAssignments]
  );

  const unassignedFurniture = furniture.filter(
    (item) => !assignedIds.has(String(item.id))
  );

  const roomSummary = useMemo(() => {
    const counts = new Map<string, number>();

    validAssignments.forEach((assignment) => {
      counts.set(
        assignment.room,
        (counts.get(assignment.room) ?? 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);
  }, [validAssignments]);

  const taskSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const pending = tasks.filter(
      (task) => normalizeStatus(task.status) === "pending"
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        normalizeStatus(task.status) === "in progress" ||
        normalizeStatus(task.status) === "in-progress"
    ).length;

    const completed = tasks.filter(
      (task) => normalizeStatus(task.status) === "completed"
    ).length;

    const overdue = tasks.filter((task) => {
      const date = getTaskDate(task);
      const status = normalizeStatus(task.status);
      return (
        Boolean(date) &&
        date < today &&
        status !== "completed" &&
        status !== "cancelled"
      );
    }).length;

    return { pending, inProgress, completed, overdue };
  }, [tasks]);

  const completionRate =
    tasks.length > 0
      ? Math.round((taskSummary.completed / tasks.length) * 100)
      : 0;

  const taskRooms = Array.from(
    new Set(
      tasks
        .map((task) => String(task.destinationRoom ?? task.room ?? "").trim())
        .filter(Boolean)
    )
  ).sort();

  const filteredTasks = tasks.filter((task) => {
    const taskStatus = normalizeStatus(task.status);
    const taskRoom = String(
      task.destinationRoom ?? task.room ?? ""
    ).trim();

    const taskName = String(
      task.title ?? task.furnitureName ?? task.furnitureId ?? ""
    );

    const matchesSearch =
      taskName.toLowerCase().includes(search.toLowerCase()) ||
      taskRoom.toLowerCase().includes(search.toLowerCase()) ||
      String(task.notes ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      taskStatus === statusFilter.toLowerCase();

    const matchesRoom =
      roomFilter === "All" || taskRoom === roomFilter;

    return matchesSearch && matchesStatus && matchesRoom;
  });

  const exportReport = () => {
    const rows = [
      ["Furniture Room Assignment Insights"],
      [],
      ["Metric", "Value"],
      ["Total furniture", String(furniture.length)],
      ["Assigned furniture", String(assignedIds.size)],
      ["Unassigned furniture", String(unassignedFurniture.length)],
      ["Scheduled tasks", String(tasks.length)],
      ["Pending tasks", String(taskSummary.pending)],
      ["In progress tasks", String(taskSummary.inProgress)],
      ["Completed tasks", String(taskSummary.completed)],
      ["Overdue tasks", String(taskSummary.overdue)],
      ["Completion rate", `${completionRate}%`],
      [],
      ["Room", "Furniture count"],
      ...roomSummary.map((item) => [item.room, String(item.count)]),
      [],
      ["Task", "Room", "Date", "Status", "Notes"],
      ...filteredTasks.map((task) => [
        String(task.title ?? task.furnitureName ?? task.furnitureId ?? "Task"),
        String(task.destinationRoom ?? task.room ?? ""),
        getTaskDate(task),
        String(task.status ?? "Pending"),
        String(task.notes ?? ""),
      ]),
    ];

    downloadCsv(rows, "furniture-room-assignment-insights.csv");
  };

  const Metric = ({
    label,
    value,
    description,
  }: {
    label: string;
    value: string | number;
    description: string;
  }) => (
    <div style={cardStyle}>
      <div style={{ color: "#64748b", fontSize: "13px" }}>{label}</div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0f172a",
          margin: "8px 0",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#64748b", fontSize: "12px" }}>
        {description}
      </div>
    </div>
  );

  return (
    <section
      style={{
        padding: "24px",
        background: "#f8fafc",
        borderRadius: "14px",
        color: "#0f172a",
        display: "grid",
        gap: "20px",
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
          <h2 style={{ margin: 0, fontSize: "24px" }}>
            Furniture Room Assignment Insights
          </h2>
          <p style={{ color: "#64748b", marginBottom: 0 }}>
            Overview of furniture assignments and scheduled room changes.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" style={buttonStyle} onClick={refreshData}>
            Refresh
          </button>
          <button type="button" style={buttonStyle} onClick={exportReport}>
            Export CSV
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
        }}
      >
        <Metric
          label="Total furniture"
          value={furniture.length}
          description="Furniture items in this project"
        />
        <Metric
          label="Assigned"
          value={assignedIds.size}
          description="Items with a room assignment"
        />
        <Metric
          label="Unassigned"
          value={unassignedFurniture.length}
          description="Items without a room assignment"
        />
        <Metric
          label="Scheduled tasks"
          value={tasks.length}
          description="Tasks in the assignment schedule"
        />
        <Metric
          label="Overdue tasks"
          value={taskSummary.overdue}
          description="Past-date tasks not completed"
        />
        <Metric
          label="Completion rate"
          value={`${completionRate}%`}
          description="Completed scheduled tasks"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Assignment status</h3>
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              <span>Assigned furniture</span>
              <strong>{assignedIds.size}</strong>
            </div>
            <div
              style={{
                height: "10px",
                background: "#e2e8f0",
                borderRadius: "20px",
                marginTop: "7px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${
                    furniture.length
                      ? Math.min(100, (assignedIds.size / furniture.length) * 100)
                      : 0
                  }%`,
                  background: "#16a34a",
                }}
              />
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            {unassignedFurniture.length} furniture item(s) still need a room.
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Scheduled task status</h3>
          {[
            ["Pending", taskSummary.pending],
            ["In progress", taskSummary.inProgress],
            ["Completed", taskSummary.completed],
            ["Overdue", taskSummary.overdue],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Furniture by room</h3>
        {roomSummary.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            No room assignments were found. Add assignments using the room
            assignment feature.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {roomSummary.map(({ room, count }) => (
              <div key={room}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "5px",
                  }}
                >
                  <span>{room}</span>
                  <strong>{count} item(s)</strong>
                </div>
                <div
                  style={{
                    height: "9px",
                    background: "#e2e8f0",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        furniture.length
                          ? Math.min(100, (count / furniture.length) * 100)
                          : 0
                      }%`,
                      background: "#2563eb",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Scheduled assignment tasks</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task, room or notes..."
            style={{
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
              minWidth: 0,
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
            }}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={roomFilter}
            onChange={(event) => setRoomFilter(event.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
            }}
          >
            <option value="All">All rooms</option>
            {taskRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <p style={{ color: "#64748b" }}>No matching scheduled tasks found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["Task", "Destination room", "Date", "Status"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{ padding: "11px", whiteSpace: "nowrap" }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <tr
                    key={String(task.id ?? `${getTaskDate(task)}-${index}`)}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "11px" }}>
                      {task.title ??
                        task.furnitureName ??
                        (task.furnitureId != null
                          ? `Furniture ${task.furnitureId}`
                          : task.furnitureIds?.join(", ") || "Assignment task")}
                      {task.notes ? (
                        <div style={{ color: "#64748b", marginTop: "3px" }}>
                          {task.notes}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: "11px" }}>
                      {task.destinationRoom ?? task.room ?? "Not specified"}
                    </td>
                    <td style={{ padding: "11px" }}>
                      {getTaskDate(task) || "Not scheduled"}
                    </td>
                    <td style={{ padding: "11px" }}>
                      {task.status ?? "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {unassignedFurniture.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Unassigned furniture</h3>
          <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
            {unassignedFurniture.slice(0, 10).map((item) => (
              <li key={String(item.id)} style={{ padding: "4px 0" }}>
                {item.name} ({item.category})
              </li>
            ))}
          </ul>
          {unassignedFurniture.length > 10 && (
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              And {unassignedFurniture.length - 10} more item(s).
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default FurnitureRoomAssignmentInsightsDashboard;
