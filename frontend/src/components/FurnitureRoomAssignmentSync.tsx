
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

interface Assignment {
  furnitureId: string;
  furnitureName: string;
  room: string;
}

interface RelocationTask {
  id: string;
  furnitureId: string;
  furnitureName: string;
  destinationRoom: string;
  scheduledDate: string;
  status: "Pending" | "Completed";
  notes: string;
}

interface Activity {
  id: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  completedAt: string;
}

interface Props {
  furniture: FurnitureItem[];
}

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const TASK_KEY = "interior-ai-room-assignment-schedule";
const ACTIVITY_KEY = "interior-ai-room-assignment-sync-history";

function readStorage<T,>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function FurnitureRoomAssignmentSync({ furniture }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<RelocationTask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedAssignments = readStorage<unknown>(
      ASSIGNMENT_KEY,
      []
    );

    const savedTasks = readStorage<unknown>(
      TASK_KEY,
      []
    );

    const savedActivities = readStorage<Activity[]>(
      ACTIVITY_KEY,
      []
    );

    const validAssignments = Array.isArray(savedAssignments)
      ? savedAssignments.filter(
          (item): item is Assignment =>
            item !== null &&
            typeof item === "object" &&
            typeof item.furnitureId === "string" &&
            typeof item.room === "string"
        )
      : [];

    const validTasks = Array.isArray(savedTasks)
      ? savedTasks.filter(
          (item): item is RelocationTask =>
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.furnitureId === "string" &&
            typeof item.destinationRoom === "string"
        )
      : [];

    setAssignments(validAssignments);
    setTasks(validTasks);
    setActivities(
      Array.isArray(savedActivities) ? savedActivities : []
    );
  }, []);

  const furnitureMap = useMemo(
    () => new Map(furniture.map(item => [String(item.id), item])),
    [furniture]
  );

  const filteredTasks = tasks.filter(task =>
    `${task.furnitureName} ${task.destinationRoom} ${task.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completeTask = (task: RelocationTask) => {
    if (task.status === "Completed") {
      setMessage("This task is already completed.");
      return;
    }

    const item = furnitureMap.get(task.furnitureId);

    if (!item) {
      setMessage("Furniture item not found in the current project.");
      return;
    }

    const existing = assignments.find(
      assignment => assignment.furnitureId === task.furnitureId
    );

    const previousRoom = existing?.room || "Unassigned";

    const updatedAssignments = existing
      ? assignments.map(assignment =>
          assignment.furnitureId === task.furnitureId
            ? { ...assignment, room: task.destinationRoom }
            : assignment
        )
      : [
          ...assignments,
          {
            furnitureId: String(item.id),
            furnitureName: item.name,
            room: task.destinationRoom
          }
        ];

    const updatedTasks = tasks.map(current =>
      current.id === task.id
        ? { ...current, status: "Completed" as const }
        : current
    );

    const activity: Activity = {
      id: `${Date.now()}-${task.id}`,
      furnitureName: item.name,
      previousRoom,
      newRoom: task.destinationRoom,
      completedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        ASSIGNMENT_KEY,
        JSON.stringify(updatedAssignments)
      );

      localStorage.setItem(
        TASK_KEY,
        JSON.stringify(updatedTasks)
      );

      localStorage.setItem(
        ACTIVITY_KEY,
        JSON.stringify([activity, ...activities])
      );

      setAssignments(updatedAssignments);
      setTasks(updatedTasks);
      setActivities([activity, ...activities]);

      setMessage(
        `${item.name} successfully assigned to ${task.destinationRoom}.`
      );
    } catch {
      setMessage("Could not save changes. Check browser storage.");
    }
  };

  const pendingCount = tasks.filter(
    task => task.status !== "Completed"
  ).length;

  const completedCount = tasks.length - pendingCount;

  return (
    <div style={styles.container}>
      <h2>Automatic Room Assignment Sync</h2>

      <p style={styles.description}>
        Complete a relocation task to update the furniture room
        assignment automatically.
      </p>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <strong>{tasks.length}</strong>
          <span>Total Tasks</span>
        </div>

        <div style={styles.statCard}>
          <strong>{pendingCount}</strong>
          <span>Pending</span>
        </div>

        <div style={styles.statCard}>
          <strong>{completedCount}</strong>
          <span>Completed</span>
        </div>
      </div>

      {message && (
        <div style={styles.message}>{message}</div>
      )}

      <input
        style={styles.input}
        placeholder="Search furniture or destination room..."
        value={search}
        onChange={event => setSearch(event.target.value)}
      />

      <h3>Relocation Tasks</h3>

      {filteredTasks.length === 0 ? (
        <p style={styles.empty}>
          No compatible relocation tasks found.
        </p>
      ) : (
        filteredTasks.map(task => (
          <div key={task.id} style={styles.taskCard}>
            <div>
              <strong>{task.furnitureName}</strong>
              <p>Destination: {task.destinationRoom}</p>
              <p>Date: {task.scheduledDate || "Not specified"}</p>

              <span
                style={{
                  ...styles.status,
                  background:
                    task.status === "Completed"
                      ? "#dcfce7"
                      : "#fef3c7"
                }}
              >
                {task.status}
              </span>
            </div>

            <button
              style={{
                ...styles.button,
                opacity: task.status === "Completed" ? 0.5 : 1
              }}
              disabled={task.status === "Completed"}
              onClick={() => completeTask(task)}
            >
              {task.status === "Completed"
                ? "Completed"
                : "Complete & Sync"}
            </button>
          </div>
        ))
      )}

      <h3>Current Assignments</h3>

      {assignments.length === 0 ? (
        <p style={styles.empty}>
          No compatible assignments found.
        </p>
      ) : (
        assignments.map(assignment => (
          <div key={assignment.furnitureId} style={styles.row}>
            <span>{assignment.furnitureName}</span>
            <strong>{assignment.room}</strong>
          </div>
        ))
      )}

      <h3>Recent Sync History</h3>

      {activities.length === 0 ? (
        <p style={styles.empty}>No relocation activity yet.</p>
      ) : (
        activities.slice(0, 10).map(activity => (
          <div key={activity.id} style={styles.historyCard}>
            <strong>{activity.furnitureName}</strong>
            <p>
              {activity.previousRoom} → {activity.newRoom}
            </p>
            <small>
              {new Date(activity.completedAt).toLocaleString()}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    margin: "20px 0",
    background: "#ffffff",
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
    marginBottom: 20
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 16,
    background: "#f1f5f9",
    borderRadius: 10
  },
  message: {
    padding: 12,
    marginBottom: 15,
    background: "#eff6ff",
    borderRadius: 8,
    color: "#1d4ed8"
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 20,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    boxSizing: "border-box"
  },
  taskCard: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginBottom: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 10
  },
  button: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12
  },
  empty: {
    color: "#94a3b8",
    padding: 12
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderBottom: "1px solid #e5e7eb"
  },
  historyCard: {
    padding: 12,
    marginBottom: 10,
    background: "#f8fafc",
    borderRadius: 8
  }
};

export default FurnitureRoomAssignmentSync;
