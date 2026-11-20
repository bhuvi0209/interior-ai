
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type ActionStatus = "Pending" | "Accepted" | "Rejected" | "Completed";
type RecommendationPriority = "High" | "Medium" | "Low";
type RecommendationStatus = "New" | "Reviewed" | "Dismissed";

interface ReviewAction {
  id: string;
  furnitureId: string;
  furnitureName: string;
  title: string;
  notes: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
}

interface RecommendationDecision {
  id: string;
  status: RecommendationStatus;
  updatedAt: string;
}

interface Recommendation {
  id: string;
  furnitureId: string;
  furnitureName: string;
  title: string;
  reason: string;
  suggestedAction: string;
  priority: RecommendationPriority;
  sourceActionId: string;
  createdAt: string;
}

const ACTIONS_KEY = "interior-ai-room-assignment-decisions";
const DECISIONS_KEY =
  "interior-ai-room-assignment-recommendation-decisions";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1250px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    color: "#222",
  },
  heading: {
    fontSize: "26px",
    marginBottom: "8px",
  },
  description: {
    color: "#666",
    lineHeight: 1.6,
    marginBottom: "22px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "17px",
    background: "#fff",
  },
  cardLabel: {
    color: "#666",
    fontSize: "14px",
  },
  cardValue: {
    fontSize: "27px",
    fontWeight: 700,
    marginTop: "10px",
  },
  section: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
  },
  sectionTitle: {
    fontSize: "19px",
    marginTop: 0,
    marginBottom: "16px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    padding: "9px 13px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "9px 13px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "9px 13px",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
  },
  recommendation: {
    border: "1px solid #ddd",
    borderRadius: "9px",
    padding: "16px",
    marginBottom: "12px",
    background: "#fff",
  },
  row: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "14px",
  },
  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#f1f5f9",
    fontSize: "12px",
    fontWeight: 700,
  },
  muted: {
    color: "#777",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};

function readArray<T,>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function validAction(item: unknown): item is ReviewAction {
  if (!item || typeof item !== "object") return false;

  const action = item as Record<string, unknown>;

  return (
    typeof action.id === "string" &&
    typeof action.furnitureId === "string" &&
    typeof action.furnitureName === "string" &&
    typeof action.title === "string" &&
    typeof action.notes === "string" &&
    ["Pending", "Accepted", "Rejected", "Completed"].includes(
      String(action.status)
    ) &&
    typeof action.createdAt === "string" &&
    typeof action.updatedAt === "string"
  );
}

function getAgeInDays(dateValue: string): number | null {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function FurnitureRoomAssignmentRecommendationEngine() {
  const [actions, setActions] = useState<ReviewAction[]>([]);
  const [decisions, setDecisions] = useState<
    Record<string, RecommendationDecision>
  >({});

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const savedActions = readArray<unknown>(ACTIONS_KEY);
    const validActions = savedActions.filter(validAction);

    setActions(validActions);

    const savedDecisions =
      readArray<RecommendationDecision>(DECISIONS_KEY);

    const decisionMap: Record<string, RecommendationDecision> = {};

    savedDecisions.forEach((decision) => {
      if (
        decision &&
        typeof decision.id === "string" &&
        ["New", "Reviewed", "Dismissed"].includes(decision.status)
      ) {
        decisionMap[decision.id] = decision;
      }
    });

    setDecisions(decisionMap);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DECISIONS_KEY,
        JSON.stringify(Object.values(decisions))
      );
    } catch (error) {
      console.error("Could not save recommendation decisions:", error);
    }
  }, [decisions]);

  const recommendations = useMemo(() => {
    const generated: Recommendation[] = [];

    const furnitureGroups = new Map<string, ReviewAction[]>();

    actions.forEach((action) => {
      const id = String(action.furnitureId);

      const existing = furnitureGroups.get(id) || [];
      existing.push(action);

      furnitureGroups.set(id, existing);
    });

    actions.forEach((action) => {
      const age = getAgeInDays(action.createdAt);

      if (action.status === "Pending") {
        const isOld = age !== null && age >= 7;

        generated.push({
          id: `pending-${action.id}`,
          furnitureId: action.furnitureId,
          furnitureName: action.furnitureName,
          title: isOld
            ? "Review an overdue pending action"
            : "Review a pending action",
          reason: isOld
            ? `This action has been pending for approximately ${age} days.`
            : "This action has not yet received a decision.",
          suggestedAction: isOld
            ? "Review the action and decide whether to accept, reject, or complete it."
            : "Check the action details and decide on the next step.",
          priority: isOld ? "High" : "Medium",
          sourceActionId: action.id,
          createdAt: action.createdAt,
        });
      }

      if (action.status === "Accepted") {
        generated.push({
          id: `accepted-${action.id}`,
          furnitureId: action.furnitureId,
          furnitureName: action.furnitureName,
          title: "Follow up on an accepted action",
          reason: "This action has been accepted but is not marked completed.",
          suggestedAction:
            "Check whether the accepted work has been carried out and update its status when appropriate.",
          priority: "Medium",
          sourceActionId: action.id,
          createdAt: action.createdAt,
        });
      }

      if (action.status === "Rejected") {
        generated.push({
          id: `rejected-${action.id}`,
          furnitureId: action.furnitureId,
          furnitureName: action.furnitureName,
          title: "Review a rejected action",
          reason: "This action was rejected. Its notes may contain useful context.",
          suggestedAction:
            "Review the reason for rejection and decide whether a different action is needed.",
          priority: "Low",
          sourceActionId: action.id,
          createdAt: action.createdAt,
        });
      }
    });

    furnitureGroups.forEach((group, furnitureId) => {
      if (group.length >= 3) {
        const latest = [...group].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )[0];

        if (latest) {
          generated.push({
            id: `repeated-${furnitureId}`,
            furnitureId,
            furnitureName: latest.furnitureName,
            title: "Review repeated furniture actions",
            reason: `This furniture has ${group.length} recorded action entries.`,
            suggestedAction:
              "Check the previous decisions and notes to see whether a more consistent room assignment plan is needed.",
            priority: group.length >= 5 ? "High" : "Medium",
            sourceActionId: latest.id,
            createdAt: latest.createdAt,
          });
        }
      }
    });

    return generated;
  }, [actions]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((recommendation) => {
      const text = search.toLowerCase();

      const matchesSearch =
        recommendation.furnitureName.toLowerCase().includes(text) ||
        recommendation.title.toLowerCase().includes(text) ||
        recommendation.reason.toLowerCase().includes(text);

      const matchesPriority =
        priorityFilter === "All" ||
        recommendation.priority === priorityFilter;

      const currentStatus =
        decisions[recommendation.id]?.status || "New";

      const matchesStatus =
        statusFilter === "All" || currentStatus === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [
    recommendations,
    search,
    priorityFilter,
    statusFilter,
    decisions,
  ]);

  const highCount = recommendations.filter(
    (item) => item.priority === "High"
  ).length;

  const mediumCount = recommendations.filter(
    (item) => item.priority === "Medium"
  ).length;

  const lowCount = recommendations.filter(
    (item) => item.priority === "Low"
  ).length;

  const reviewedCount = recommendations.filter(
    (item) => decisions[item.id]?.status === "Reviewed"
  ).length;

  const dismissedCount = recommendations.filter(
    (item) => decisions[item.id]?.status === "Dismissed"
  ).length;

  const newCount = recommendations.filter(
    (item) => !decisions[item.id] || decisions[item.id].status === "New"
  ).length;

  function updateDecision(
    recommendationId: string,
    status: RecommendationStatus
  ) {
    setDecisions((previous) => ({
      ...previous,
      [recommendationId]: {
        id: recommendationId,
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function exportCSV() {
    const headers = [
      "Furniture",
      "Recommendation",
      "Reason",
      "Suggested Action",
      "Priority",
      "Status",
      "Source Action ID",
      "Created At",
    ];

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredRecommendations.map((item) => {
      const status = decisions[item.id]?.status || "New";

      return [
        item.furnitureName,
        item.title,
        item.reason,
        item.suggestedAction,
        item.priority,
        status,
        item.sourceActionId,
        item.createdAt,
      ]
        .map(escapeCSV)
        .join(",");
    });

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-recommendations.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Recommendation Engine
      </h2>

      <p style={styles.description}>
        Review automatically generated suggestions based on your
        furniture room assignment action records.
      </p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Recommendations</div>
          <div style={styles.cardValue}>
            {recommendations.length}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>High Priority</div>
          <div style={styles.cardValue}>{highCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Medium Priority</div>
          <div style={styles.cardValue}>{mediumCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Low Priority</div>
          <div style={styles.cardValue}>{lowCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>New</div>
          <div style={styles.cardValue}>{newCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Reviewed</div>
          <div style={styles.cardValue}>{reviewedCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Dismissed</div>
          <div style={styles.cardValue}>{dismissedCount}</div>
        </div>
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Recommendation Filters</h3>

        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: "1 1 220px" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recommendations..."
          />

          <select
            style={styles.input}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="All">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>

          <select
            style={styles.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All review statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Dismissed">Dismissed</option>
          </select>

          <button
            type="button"
            style={styles.button}
            onClick={exportCSV}
            disabled={filteredRecommendations.length === 0}
          >
            Export CSV
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Generated Recommendations</h3>

        {filteredRecommendations.length === 0 ? (
          <p>
            No recommendations match your filters. Create or update
            actions in Day 95 to generate recommendations.
          </p>
        ) : (
          filteredRecommendations.map((item) => {
            const currentStatus =
              decisions[item.id]?.status || "New";

            return (
              <div key={item.id} style={styles.recommendation}>
                <div style={styles.row}>
                  <strong>{item.furnitureName}</strong>

                  <span style={styles.badge}>
                    {item.priority} Priority
                  </span>

                  <span style={styles.badge}>
                    {currentStatus}
                  </span>
                </div>

                <h3 style={{ fontSize: "17px", margin: "8px 0" }}>
                  {item.title}
                </h3>

                <p>{item.reason}</p>

                <p>
                  <strong>Suggested next step:</strong>{" "}
                  {item.suggestedAction}
                </p>

                <p style={styles.muted}>
                  Source action: {item.sourceActionId}
                </p>

                <div style={styles.row}>
                  <button
                    type="button"
                    style={styles.button}
                    onClick={() =>
                      updateDecision(item.id, "Reviewed")
                    }
                  >
                    Mark Reviewed
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() =>
                      updateDecision(item.id, "New")
                    }
                  >
                    Mark New
                  </button>

                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={() =>
                      updateDecision(item.id, "Dismissed")
                    }
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>How Recommendations Work</h3>

        <ul>
          <li>
            Pending actions older than seven days receive High priority.
          </li>
          <li>
            Newer pending actions receive Medium priority.
          </li>
          <li>
            Accepted actions receive a follow-up recommendation.
          </li>
          <li>
            Rejected actions receive a review recommendation.
          </li>
          <li>
            Furniture with three or more action records receives a
            repeated-action recommendation.
          </li>
          <li>
            Furniture with five or more action records receives High
            priority for that repeated-action recommendation.
          </li>
        </ul>

        <p style={styles.muted}>
          These are rule-based suggestions from local data. They are
          not AI predictions and do not automatically move furniture
          or modify your room assignments.
        </p>
      </section>

      <p style={styles.muted}>
        Action records are read from interior-ai-room-assignment-decisions.
        Review decisions are stored separately in
        interior-ai-room-assignment-recommendation-decisions.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentRecommendationEngine;
