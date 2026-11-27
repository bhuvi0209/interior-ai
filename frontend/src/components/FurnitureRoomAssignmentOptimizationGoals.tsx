
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface HistoryRecord {
  id: string;
  title: string;
  createdAt: string;
  score: number;
  totalFurniture: number;
  assignedFurniture: number;
  unassignedFurniture: number;
  totalActions: number;
  pendingActions: number;
  reviewedActions: number;
  completedActions: number;
}

interface OptimizationGoals {
  scoreTarget: number;
  coverageTarget: number;
  plannerTarget: number;
  updatedAt: string;
}

interface GoalItemProps {
  title: string;
  description: string;
  current: number | null;
  target: number;
}

const HISTORY_KEY = "interior-ai-room-optimization-history";
const GOALS_KEY = "interior-ai-room-optimization-goals";

const DEFAULT_GOALS: OptimizationGoals = {
  scoreTarget: 90,
  coverageTarget: 95,
  plannerTarget: 80,
  updatedAt: "",
};

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const readHistory = (): HistoryRecord[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is HistoryRecord =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.createdAt === "string"
    );
  } catch (error) {
    console.error("Unable to read optimization history:", error);
    return [];
  }
};

const readGoals = (): OptimizationGoals => {
  try {
    const saved = localStorage.getItem(GOALS_KEY);

    if (!saved) return DEFAULT_GOALS;

    const parsed: unknown = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_GOALS;
    }

    const data = parsed as Partial<OptimizationGoals>;

    return {
      scoreTarget: Math.min(
        100,
        Math.max(1, safeNumber(data.scoreTarget) || DEFAULT_GOALS.scoreTarget)
      ),
      coverageTarget: Math.min(
        100,
        Math.max(1, safeNumber(data.coverageTarget) || DEFAULT_GOALS.coverageTarget)
      ),
      plannerTarget: Math.min(
        100,
        Math.max(1, safeNumber(data.plannerTarget) || DEFAULT_GOALS.plannerTarget)
      ),
      updatedAt:
        typeof data.updatedAt === "string" ? data.updatedAt : "",
    };
  } catch (error) {
    console.error("Unable to read optimization goals:", error);
    return DEFAULT_GOALS;
  }
};

const calculateCoverage = (record: HistoryRecord): number => {
  const total = safeNumber(record.totalFurniture);

  if (total <= 0) return 0;

  return Math.round(
    (safeNumber(record.assignedFurniture) / total) * 100
  );
};

const calculatePlannerProgress = (record: HistoryRecord): number => {
  const total = safeNumber(record.totalActions);

  if (total <= 0) return 100;

  const progress =
    safeNumber(record.completedActions) +
    safeNumber(record.reviewedActions) * 0.5;

  return Math.round((progress / total) * 100);
};

const formatDate = (value: string): string => {
  if (!value) return "Not saved yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
};

const escapeCsv = (value: unknown): string => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

function GoalProgress({
  title,
  description,
  current,
  target,
}: GoalItemProps) {
  const achieved = current !== null && current >= target;
  const progress =
    current === null || target <= 0
      ? 0
      : Math.min(100, Math.max(0, (current / target) * 100));

  return (
    <div style={styles.goalCard}>
      <div style={styles.goalTop}>
        <div>
          <h3 style={styles.goalTitle}>{title}</h3>
          <p style={styles.muted}>{description}</p>
        </div>

        <span
          style={{
            ...styles.status,
            background: achieved ? "#dcfce7" : "#fef3c7",
            color: achieved ? "#166534" : "#92400e",
          }}
        >
          {current === null
            ? "Waiting for data"
            : achieved
              ? "Target achieved"
              : "In progress"}
        </span>
      </div>

      <div style={styles.goalNumbers}>
        <strong style={styles.currentValue}>
          {current === null ? "—" : `${current.toFixed(1)}%`}
        </strong>

        <span style={styles.targetValue}>
          Target: {target}%
        </span>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
            background: achieved ? "#16a34a" : "#2563eb",
          }}
        />
      </div>

      <p style={styles.progressCaption}>
        {current === null
          ? "Save a Day 105 snapshot to calculate progress."
          : `${Math.round(progress)}% of your target reached`}
      </p>
    </div>
  );
}

function FurnitureRoomAssignmentOptimizationGoals({
  furniture,
}: {
  furniture: {
    id: string | number;
    name: string;
    category?: string;
  }[];
}) {
  const [history, setHistory] = useState<HistoryRecord[]>(() =>
    readHistory()
  );

  const [goals, setGoals] = useState<OptimizationGoals>(() =>
    readGoals()
  );

  const [scoreInput, setScoreInput] = useState(
    String(goals.scoreTarget)
  );
  const [coverageInput, setCoverageInput] = useState(
    String(goals.coverageTarget)
  );
  const [plannerInput, setPlannerInput] = useState(
    String(goals.plannerTarget)
  );

  const [message, setMessage] = useState("");

  const latest = useMemo(() => {
    if (history.length === 0) return null;

    return [...history].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )[0];
  }, [history]);

  const currentScore = latest
    ? Math.min(100, Math.max(0, safeNumber(latest.score)))
    : null;

  const currentCoverage = latest
    ? Math.min(100, Math.max(0, calculateCoverage(latest)))
    : null;

  const currentPlannerProgress = latest
    ? Math.min(100, Math.max(0, calculatePlannerProgress(latest)))
    : null;

  const achievedCount = [
    currentScore !== null && currentScore >= goals.scoreTarget,
    currentCoverage !== null &&
      currentCoverage >= goals.coverageTarget,
    currentPlannerProgress !== null &&
      currentPlannerProgress >= goals.plannerTarget,
  ].filter(Boolean).length;

  const saveGoals = () => {
    const score = Number(scoreInput);
    const coverage = Number(coverageInput);
    const planner = Number(plannerInput);

    const values = [score, coverage, planner];

    if (
      values.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 1 ||
          value > 100
      )
    ) {
      setMessage("Enter valid targets between 1 and 100.");
      return;
    }

    const updatedGoals: OptimizationGoals = {
      scoreTarget: score,
      coverageTarget: coverage,
      plannerTarget: planner,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));

      setGoals(updatedGoals);
      setMessage("Your optimization goals have been saved.");
    } catch (error) {
      console.error("Unable to save optimization goals:", error);
      setMessage("Unable to save goals. Check your browser storage.");
    }
  };

  const resetGoals = () => {
    const resetValues: OptimizationGoals = {
      ...DEFAULT_GOALS,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(resetValues));

      setGoals(resetValues);
      setScoreInput(String(resetValues.scoreTarget));
      setCoverageInput(String(resetValues.coverageTarget));
      setPlannerInput(String(resetValues.plannerTarget));
      setMessage("Default goals have been restored.");
    } catch (error) {
      console.error("Unable to reset optimization goals:", error);
      setMessage("Unable to reset goals. Check your browser storage.");
    }
  };

  const refreshHistory = () => {
    setHistory(readHistory());
    setMessage("Optimization history refreshed.");
  };

  const exportCsv = () => {
    const rows = [
      ["Metric", "Current Value", "Target", "Status"],
      [
        "Optimization Score",
        currentScore === null ? "No data" : `${currentScore}%`,
        `${goals.scoreTarget}%`,
        currentScore === null
          ? "Waiting for data"
          : currentScore >= goals.scoreTarget
            ? "Achieved"
            : "In progress",
      ],
      [
        "Assignment Coverage",
        currentCoverage === null ? "No data" : `${currentCoverage}%`,
        `${goals.coverageTarget}%`,
        currentCoverage === null
          ? "Waiting for data"
          : currentCoverage >= goals.coverageTarget
            ? "Achieved"
            : "In progress",
      ],
      [
        "Planner Progress",
        currentPlannerProgress === null
          ? "No data"
          : `${currentPlannerProgress}%`,
        `${goals.plannerTarget}%`,
        currentPlannerProgress === null
          ? "Waiting for data"
          : currentPlannerProgress >= goals.plannerTarget
            ? "Achieved"
            : "In progress",
      ],
      ["Goals last updated", formatDate(goals.updatedAt), "", ""],
      [
        "Latest snapshot",
        latest ? latest.title : "No snapshot",
        "",
        "",
      ],
      [
        "Snapshot date",
        latest ? formatDate(latest.createdAt) : "No snapshot",
        "",
        "",
      ],
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-optimization-goals.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>
            Furniture Room Assignment Optimization Goals
          </h2>

          <p style={styles.muted}>
            Set performance targets and track your latest optimization
            results.
          </p>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={refreshHistory}
          >
            Refresh History
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={styles.summaryBanner}>
        <div>
          <strong>Goals achieved: {achievedCount} / 3</strong>
          <p style={styles.bannerText}>
            {latest
              ? `Progress is based on the latest saved snapshot from ${formatDate(latest.createdAt)}.`
              : "Save a Day 105 optimization snapshot to begin tracking your goals."}
          </p>
        </div>

        <div style={styles.furnitureCount}>
          Current project furniture: {furniture.length}
        </div>
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Set Your Optimization Targets</h3>

        <p style={styles.muted}>
          Enter a percentage between 1 and 100 for each target.
        </p>

        <div style={styles.inputGrid}>
          <label style={styles.inputLabel}>
            Optimization score target (%)
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.inputLabel}>
            Assignment coverage target (%)
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={coverageInput}
              onChange={(event) => setCoverageInput(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.inputLabel}>
            Planner progress target (%)
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={plannerInput}
              onChange={(event) => setPlannerInput(event.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={saveGoals}
          >
            Save Goals
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={resetGoals}
          >
            Restore Default Goals
          </button>
        </div>

        {message && (
          <p role="status" style={styles.message}>
            {message}
          </p>
        )}

        <p style={styles.lastUpdated}>
          Last saved: {formatDate(goals.updatedAt)}
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Goal Progress Dashboard</h3>

        <div style={styles.goalGrid}>
          <GoalProgress
            title="Optimization Score"
            description="Your overall room assignment optimization score."
            current={currentScore}
            target={goals.scoreTarget}
          />

          <GoalProgress
            title="Assignment Coverage"
            description="Percentage of furniture assigned to a room."
            current={currentCoverage}
            target={goals.coverageTarget}
          />

          <GoalProgress
            title="Planner Progress"
            description="Completed actions plus half credit for reviewed actions."
            current={currentPlannerProgress}
            target={goals.plannerTarget}
          />
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Latest Snapshot Details</h3>

        {!latest ? (
          <div style={styles.emptyState}>
            No optimization snapshot is available. Save a snapshot using
            the Day 105 history component, then click Refresh History.
          </div>
        ) : (
          <div style={styles.detailsGrid}>
            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Snapshot name</span>
              <strong>{latest.title}</strong>
            </div>

            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Snapshot date</span>
              <strong>{formatDate(latest.createdAt)}</strong>
            </div>

            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Assigned furniture</span>
              <strong>
                {safeNumber(latest.assignedFurniture)} /{" "}
                {safeNumber(latest.totalFurniture)}
              </strong>
            </div>

            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Pending planner actions</span>
              <strong>{safeNumber(latest.pendingActions)}</strong>
            </div>

            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Reviewed actions</span>
              <strong>{safeNumber(latest.reviewedActions)}</strong>
            </div>

            <div style={styles.detailCard}>
              <span style={styles.detailLabel}>Completed actions</span>
              <strong>{safeNumber(latest.completedActions)}</strong>
            </div>
          </div>
        )}
      </section>

      <p style={styles.footerNote}>
        Goal targets and their last saved date are stored separately from
        optimization history in your browser's localStorage. The dashboard
        does not automatically change furniture assignments or planner
        actions.
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    color: "#1f2937",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },
  heading: {
    margin: "0 0 8px",
    fontSize: "24px",
  },
  muted: {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "6px 0",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
  },
  primaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },
  summaryBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px",
    border: "1px solid #bfdbfe",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1e40af",
  },
  bannerText: {
    margin: "6px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  furnitureCount: {
    fontSize: "13px",
    fontWeight: 700,
  },
  section: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },
  inputLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
  },
  message: {
    margin: "12px 0 0",
    color: "#166534",
    fontSize: "13px",
    fontWeight: 700,
  },
  lastUpdated: {
    margin: "12px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },
  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  goalCard: {
    padding: "17px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#ffffff",
  },
  goalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "10px",
  },
  goalTitle: {
    fontSize: "16px",
    margin: 0,
  },
  status: {
    padding: "5px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
  },
  goalNumbers: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "10px",
    marginTop: "18px",
  },
  currentValue: {
    fontSize: "27px",
  },
  targetValue: {
    color: "#6b7280",
    fontSize: "12px",
  },
  progressTrack: {
    width: "100%",
    height: "11px",
    marginTop: "12px",
    borderRadius: "20px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },
  progressCaption: {
    margin: "9px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "15px",
  },
  detailCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#f9fafb",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },
  detailLabel: {
    color: "#6b7280",
    fontSize: "12px",
  },
  emptyState: {
    marginTop: "12px",
    padding: "20px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    background: "#f9fafb",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  footerNote: {
    margin: 0,
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: 1.6,
  },
};

export default FurnitureRoomAssignmentOptimizationGoals;
