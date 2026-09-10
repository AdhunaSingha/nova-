import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import taskService from "../services/taskService";
import { useAuth } from "../context/AuthContext";

import "../styles/task-details.css";

const STATUS_OPTIONS = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];

const PRIORITY_OPTIONS = [
  {
    value: "P0",
    label: "P0",
    name: "Blocker",
  },
  {
    value: "P1",
    label: "P1",
    name: "High",
  },
  {
    value: "P2",
    label: "P2",
    name: "Normal",
  },
  {
    value: "P3",
    label: "P3",
    name: "Low",
  },
];

function getId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || "";
}

function getName(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.fullName ||
    value.username ||
    value.email ||
    ""
  );
}

function getInitials(name) {
  if (!name) {
    return "—";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const difference =
    Date.now() - date.getTime();

  const seconds = Math.floor(
    Math.abs(difference) / 1000
  );

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(dateValue);
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value;
}

function normalizeTask(rawTask) {
  if (!rawTask) {
    return null;
  }

  const project =
    rawTask.project &&
    typeof rawTask.project === "object"
      ? rawTask.project
      : null;

  const assignee =
    rawTask.assignee &&
    typeof rawTask.assignee === "object"
      ? rawTask.assignee
      : null;

  const reviewer =
    rawTask.reviewer &&
    typeof rawTask.reviewer === "object"
      ? rawTask.reviewer
      : null;

  const createdBy =
    rawTask.createdBy &&
    typeof rawTask.createdBy === "object"
      ? rawTask.createdBy
      : null;

  const activities = normalizeList(
    rawTask.activities
  ).map((activity) => ({
    ...activity,
    name:
      getName(activity.user) ||
      activity.name ||
      "NOVA System",
    role:
      activity.user?.role ||
      activity.role ||
      "System",
    initials:
      getInitials(
        getName(activity.user) ||
          activity.name
      ),
    text:
      activity.message ||
      activity.text ||
      "",
    time:
      formatRelativeTime(
        activity.createdAt
      ) ||
      activity.time ||
      "",
    type: activity.type || "system",
  }));

  const subtasks = normalizeList(
    rawTask.subtasks
  ).map((subtask) => ({
    id: subtask._id || subtask.id,
    title: subtask.title || "Untitled subtask",
    done: Boolean(subtask.completed),
    completedAt: subtask.completedAt,
  }));

  return {
    ...rawTask,

    mongoId:
      rawTask._id ||
      rawTask.id ||
      "",

    id:
      rawTask.key ||
      rawTask.id ||
      rawTask._id ||
      "",

    title:
      rawTask.title ||
      "Untitled task",

    description:
      rawTask.description ||
      "No description has been provided for this task.",

    status:
      rawTask.status ||
      "Backlog",

    priority:
      rawTask.priority ||
      "P2",

    project,
    projectId: getId(project || rawTask.project),

    projectName:
      project?.name ||
      project?.key ||
      "Unassigned Project",

    projectCode:
      project?.key ||
      "",

    area:
      rawTask.area ||
      project?.category ||
      "Workspace",

    createdBy:
      getName(createdBy) ||
      "Unknown",

    assignee:
      getName(assignee) ||
      "Unassigned",

    assigneeId:
      getId(assignee || rawTask.assignee),

    reviewer:
      getName(reviewer) ||
      "Unassigned",

    reviewerId:
      getId(reviewer || rawTask.reviewer),

    sprint:
      rawTask.sprint ||
      "No Sprint",

    sprintProgress:
      rawTask.sprintProgress ||
      "",

    storyPoints:
      Number(rawTask.storyPoints || 0),

    estimateMinutes:
      Number(rawTask.estimatedMinutes || 0),

    timeLoggedMinutes:
      Number(rawTask.timeLoggedMinutes || 0),

    dueDate:
      rawTask.dueDate ||
      "",

    labels:
      normalizeList(rawTask.labels),

    technicalSpecifications:
      rawTask.technicalSpecifications ||
      "",

    threatModel:
      normalizeList(rawTask.threatModel),

    acceptanceCriteria:
      normalizeList(rawTask.acceptanceCriteria),

    environment:
      rawTask.environment ||
      "Not Set",

    environmentStatus:
      rawTask.environmentStatus ||
      "Unknown",

    environmentVersion:
      rawTask.environmentVersion ||
      "",

    endpoint:
      rawTask.endpoint ||
      "",

    observability:
      rawTask.observability ||
      "",

    branch:
      rawTask.branch ||
      "",

    pullRequestUrl:
      rawTask.pullRequestUrl ||
      "",

    issueUrl:
      rawTask.issueUrl ||
      "",

    dependencies:
      normalizeList(rawTask.dependencies),

    subtasks,

    activities,
  };
}

function getPriorityName(priority) {
  const item = PRIORITY_OPTIONS.find(
    (option) => option.value === priority
  );

  return item?.name || priority || "Normal";
}

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("Backlog");
  const [priority, setPriority] = useState("P2");

  const [isWatching, setIsWatching] = useState(true);

  const [comment, setComment] = useState("");
  const [activityFilter, setActivityFilter] =
    useState("All");

  const [showTimeModal, setShowTimeModal] =
    useState(false);

  const [showMoreMenu, setShowMoreMenu] =
    useState(false);

  const [toast, setToast] = useState("");

  const [subtasks, setSubtasks] = useState([]);

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [savingPriority, setSavingPriority] =
    useState(false);

  const [postingComment, setPostingComment] =
    useState(false);

  const [addingSubtask, setAddingSubtask] =
    useState(false);

  const [updatingSubtaskId, setUpdatingSubtaskId] =
    useState("");

  const [loggingTime, setLoggingTime] =
    useState(false);

  const [timeHours, setTimeHours] =
    useState("1");

  const [timeDescription, setTimeDescription] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const showToast = useCallback(
    (message) => {
      setToast(message);

      window.setTimeout(() => {
        setToast("");
      }, 2800);
    },
    []
  );

  const loadTask = useCallback(async () => {
    if (!id) {
      setError("No task ID was provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await taskService.getTask(id);

      const rawTask =
        response?.task ||
        response?.data ||
        response;

      const normalized =
        normalizeTask(rawTask);

      if (!normalized) {
        throw new Error(
          "Task was not found."
        );
      }

      setTask(normalized);
      setStatus(normalized.status);
      setPriority(normalized.priority);
      setSubtasks(normalized.subtasks);
    } catch (err) {
      console.error(
        "Failed to load task:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load this task."
      );

      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const allActivity = useMemo(() => {
    if (!task) {
      return [];
    }

    return task.activities || [];
  }, [task]);

  const visibleActivity = useMemo(() => {
    if (activityFilter === "All") {
      return allActivity;
    }

    if (activityFilter === "Comments") {
      return allActivity.filter(
        (item) =>
          item.type === "comment"
      );
    }

    if (activityFilter === "Git") {
      return allActivity.filter(
        (item) =>
          item.type === "git"
      );
    }

    return allActivity;
  }, [allActivity, activityFilter]);

  const completedSubtasks = useMemo(
    () =>
      subtasks.filter(
        (item) => item.done
      ).length,
    [subtasks]
  );

  const subtaskPercentage =
    subtasks.length > 0
      ? Math.round(
          (completedSubtasks /
            subtasks.length) *
            100
        )
      : 0;

  const estimateHours = useMemo(() => {
    if (!task?.estimateMinutes) {
      return null;
    }

    return (
      task.estimateMinutes / 60
    ).toFixed(1);
  }, [task]);

  const loggedHours = useMemo(() => {
    if (!task) {
      return "0.0";
    }

    return (
      task.timeLoggedMinutes / 60
    ).toFixed(1);
  }, [task]);

  const timePercentage = useMemo(() => {
    if (
      !task?.estimateMinutes ||
      task.estimateMinutes <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (task.timeLoggedMinutes /
          task.estimateMinutes) *
          100
      )
    );
  }, [task]);

  const currentUserName =
    getName(user) ||
    "Current user";

  const currentUserInitials =
    getInitials(currentUserName);

  const handleStatusChange = async (
    event
  ) => {
    const nextStatus =
      event.target.value;

    if (
      !task ||
      nextStatus === task.status
    ) {
      return;
    }

    const previousStatus = task.status;

    setStatus(nextStatus);
    setSavingStatus(true);

    try {
      const response =
        await taskService.updateTaskStatus(
          task.mongoId,
          nextStatus
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setStatus(normalized.status);
        setSubtasks(normalized.subtasks);
      } else {
        setTask((current) =>
          current
            ? {
                ...current,
                status: nextStatus,
              }
            : current
        );
      }

      showToast(
        `Task status changed to ${nextStatus}.`
      );
    } catch (err) {
      console.error(
        "Failed to update task status:",
        err
      );

      setStatus(previousStatus);

      showToast(
        err?.response?.data?.message ||
          "Unable to update task status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePriorityChange = async (
    event
  ) => {
    const nextPriority =
      event.target.value;

    if (
      !task ||
      nextPriority === task.priority
    ) {
      return;
    }

    const previousPriority =
      task.priority;

    setPriority(nextPriority);
    setSavingPriority(true);

    try {
      const response =
        await taskService.updateTask(
          task.mongoId,
          {
            priority: nextPriority,
          }
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setStatus(normalized.status);
        setPriority(normalized.priority);
        setSubtasks(normalized.subtasks);
      } else {
        setTask((current) =>
          current
            ? {
                ...current,
                priority: nextPriority,
              }
            : current
        );
      }

      showToast(
        `Priority changed to ${nextPriority}.`
      );
    } catch (err) {
      console.error(
        "Failed to update priority:",
        err
      );

      setPriority(previousPriority);

      showToast(
        err?.response?.data?.message ||
          "Unable to update priority."
      );
    } finally {
      setSavingPriority(false);
    }
  };

  const handlePostComment = async () => {
    const value =
      comment.trim();

    if (!value) {
      showToast(
        "Please write a message first."
      );
      return;
    }

    if (!task) {
      return;
    }

    try {
      setPostingComment(true);

      const response =
        await taskService.addComment(
          task.mongoId,
          value
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setStatus(normalized.status);
        setPriority(normalized.priority);
        setSubtasks(normalized.subtasks);
      } else {
        await loadTask();
      }

      setComment("");

      showToast(
        "Comment posted to thread."
      );
    } catch (err) {
      console.error(
        "Failed to post comment:",
        err
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to post comment."
      );
    } finally {
      setPostingComment(false);
    }
  };

  const handleCommentKeyDown = (
    event
  ) => {
    if (
      (event.metaKey ||
        event.ctrlKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();

      handlePostComment();
    }
  };

  const handleAddSubtask = async () => {
    if (!task || addingSubtask) {
      return;
    }

    const title = window.prompt(
      "Enter new subtask description:"
    );

    if (!title || !title.trim()) {
      return;
    }

    try {
      setAddingSubtask(true);

      const response =
        await taskService.addSubtask(
          task.mongoId,
          title.trim()
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setSubtasks(normalized.subtasks);
        setStatus(normalized.status);
        setPriority(normalized.priority);
      } else {
        await loadTask();
      }

      showToast(
        "Subtask successfully created."
      );
    } catch (err) {
      console.error(
        "Failed to create subtask:",
        err
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to create subtask."
      );
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (
    subtask
  ) => {
    if (
      !task ||
      !subtask?.id ||
      updatingSubtaskId
    ) {
      return;
    }

    const nextCompleted =
      !subtask.done;

    setUpdatingSubtaskId(
      subtask.id
    );

    setSubtasks((current) =>
      current.map((item) =>
        item.id === subtask.id
          ? {
              ...item,
              done: nextCompleted,
            }
          : item
      )
    );

    try {
      const response =
        await taskService.updateSubtask(
          task.mongoId,
          subtask.id,
          {
            completed: nextCompleted,
          }
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setSubtasks(normalized.subtasks);
      }
    } catch (err) {
      console.error(
        "Failed to update subtask:",
        err
      );

      setSubtasks((current) =>
        current.map((item) =>
          item.id === subtask.id
            ? {
                ...item,
                done: subtask.done,
              }
            : item
        )
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to update subtask."
      );
    } finally {
      setUpdatingSubtaskId("");
    }
  };

  const handleLogTime = async () => {
    if (!task || loggingTime) {
      return;
    }

    const hours =
      Number(timeHours);

    if (
      !Number.isFinite(hours) ||
      hours <= 0
    ) {
      showToast(
        "Enter a valid number of hours."
      );
      return;
    }

    const minutes = Math.round(
      hours * 60
    );

    try {
      setLoggingTime(true);

      const response =
        await taskService.updateTimeLogged(
          task.mongoId,
          minutes
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setStatus(normalized.status);
        setPriority(normalized.priority);
        setSubtasks(normalized.subtasks);
      } else {
        await loadTask();
      }

      setShowTimeModal(false);
      setTimeHours("1");
      setTimeDescription("");

      showToast(
        `${hours}h logged successfully.`
      );
    } catch (err) {
      console.error(
        "Failed to log time:",
        err
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to log time."
      );
    } finally {
      setLoggingTime(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      showToast(
        "Task permalink copied to clipboard."
      );
    } catch {
      showToast(
        "Unable to access clipboard."
      );
    }
  };

  const handleToggleWatch = () => {
    const nextValue =
      !isWatching;

    setIsWatching(nextValue);

    showToast(
      nextValue
        ? "Watching task for updates."
        : "Unfollowed task updates."
    );
  };

  const handleArchiveTask = async () => {
    if (!task || deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive ${task.key}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await taskService.deleteTask(
        task.mongoId
      );

      showToast(
        "Task archived successfully."
      );

      window.setTimeout(() => {
        navigate("/tasks");
      }, 700);
    } catch (err) {
      console.error(
        "Failed to archive task:",
        err
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to archive task. You may not have permission."
      );
    } finally {
      setDeleting(false);
      setShowMoreMenu(false);
    }
  };

  const handleEditHeadline = async () => {
    if (!task) {
      return;
    }

    const nextTitle =
      window.prompt(
        "Edit task title:",
        task.title
      );

    if (
      !nextTitle ||
      !nextTitle.trim() ||
      nextTitle.trim() === task.title
    ) {
      return;
    }

    try {
      const response =
        await taskService.updateTask(
          task.mongoId,
          {
            title: nextTitle.trim(),
          }
        );

      const updatedTask =
        response?.task ||
        response?.data ||
        response;

      if (updatedTask?._id) {
        const normalized =
          normalizeTask(updatedTask);

        setTask(normalized);
        setStatus(normalized.status);
        setPriority(normalized.priority);
        setSubtasks(normalized.subtasks);
      } else {
        await loadTask();
      }

      showToast(
        "Task title updated."
      );
    } catch (err) {
      console.error(
        "Failed to update title:",
        err
      );

      showToast(
        err?.response?.data?.message ||
          "Unable to update task title."
      );
    }
  };

  if (loading) {
    return (
      <div className="task-details-page">
        <div className="task-details-loading">
          <span className="material-symbols-outlined">
            progress_activity
          </span>

          <h2>Loading task...</h2>

          <p>
            Fetching task details from NOVA API.
          </p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-details-page">
        <div className="task-details-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <h2>
            Unable to load task
          </h2>

          <p>
            {error ||
              "The requested task could not be found."}
          </p>

          <div>
            <button
              className="nova-button nova-button-secondary"
              onClick={() =>
                navigate("/tasks")
              }
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>

              Back to Board
            </button>

            <button
              className="nova-button nova-button-primary"
              onClick={loadTask}
            >
              <span className="material-symbols-outlined">
                refresh
              </span>

              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-details-page">
      {toast && (
        <div className="task-toast">
          <span className="material-symbols-outlined">
            check_circle
          </span>

          <span>{toast}</span>
        </div>
      )}

      <header className="task-details-header">
        <div className="task-details-header-left">
          <nav className="task-details-breadcrumb">
            <Link to="/dashboard">
              <span className="material-symbols-outlined">
                domain
              </span>

              NOVA
            </Link>

            <span>/</span>

            <Link to="/projects">
              Projects
            </Link>

            <span>/</span>

            {task.projectId ? (
              <Link
                to={`/projects/${task.projectId}`}
              >
                {task.projectName}
              </Link>
            ) : (
              <span>
                {task.projectName}
              </span>
            )}

            <span>/</span>

            <span>{task.sprint}</span>

            <span>/</span>

            <strong>{task.id}</strong>
          </nav>

          <div className="task-status-row">
            <span
              className={`task-status-pill ${getStatusClass(
                status
              )}`}
            >
              <span></span>

              {status.toUpperCase()}
            </span>

            <span className="task-priority-pill">
              <span className="material-symbols-outlined">
                flag
              </span>

              {getPriorityName(
                priority
              )}{" "}
              ({priority})
            </span>

            <span className="task-security-badge">
              <span className="material-symbols-outlined">
                verified_user
              </span>

              SecOps Audit Req
            </span>
          </div>
        </div>

        <div className="task-details-actions">
          <button
            className="task-action-button"
            onClick={handleCopyLink}
          >
            <span className="material-symbols-outlined">
              link
            </span>

            <span>
              Copy link
            </span>
          </button>

          <button
            className="task-action-button"
            onClick={handleToggleWatch}
          >
            <span
              className={`material-symbols-outlined ${
                isWatching
                  ? "watching"
                  : ""
              }`}
            >
              visibility
            </span>

            <span>
              {isWatching
                ? "Watching"
                : "Watch"}
            </span>
          </button>

          <button
            className="task-icon-action"
            onClick={() =>
              showToast(
                "Share dialog opened."
              )
            }
            title="Share with team"
          >
            <span className="material-symbols-outlined">
              share
            </span>
          </button>

          <div className="task-more-wrapper">
            <button
              className="task-icon-action"
              onClick={() =>
                setShowMoreMenu(
                  (current) => !current
                )
              }
              title="More options"
            >
              <span className="material-symbols-outlined">
                more_horiz
              </span>
            </button>

            {showMoreMenu && (
              <div className="task-more-menu">
                <button
                  onClick={() => {
                    setShowMoreMenu(
                      false
                    );
                    showToast(
                      "Duplicate task is not available yet."
                    );
                  }}
                >
                  <span className="material-symbols-outlined">
                    content_copy
                  </span>

                  Duplicate task
                </button>

                <button
                  onClick={
                    handleArchiveTask
                  }
                  disabled={deleting}
                >
                  <span className="material-symbols-outlined">
                    archive
                  </span>

                  {deleting
                    ? "Archiving..."
                    : "Archive task"}
                </button>
              </div>
            )}
          </div>

          <div className="task-action-divider"></div>

          <button
            className="task-back-board"
            onClick={() =>
              navigate("/tasks")
            }
          >
            <span className="material-symbols-outlined">
              arrow_back
            </span>

            <span>
              Back to Board
            </span>

            <kbd>ESC</kbd>
          </button>
        </div>
      </header>

      <div className="task-details-grid">
        <main className="task-details-main">
          <section className="task-title-card">
            <div>
              <h1>{task.title}</h1>

              <div className="task-meta-line">
                <span>
                  Created by{" "}
                  <strong>
                    {task.createdBy}
                  </strong>
                </span>

                <span>•</span>

                <span>
                  <span className="material-symbols-outlined">
                    schedule
                  </span>

                  Updated{" "}
                  {formatRelativeTime(
                    task.updatedAt
                  ) || "recently"}
                </span>

                <span>•</span>

                <span className="task-meta-highlight">
                  {task.sprint}
                </span>

                <span>•</span>

                <span>
                  <span className="material-symbols-outlined">
                    folder
                  </span>

                  {task.area}
                </span>
              </div>
            </div>

            <button
              className="task-edit-button"
              onClick={
                handleEditHeadline
              }
              title="Edit task headline"
            >
              <span className="material-symbols-outlined">
                edit
              </span>
            </button>
          </section>

          <section className="task-content-card">
            <div className="task-section-heading">
              <h2>
                <span className="material-symbols-outlined">
                  description
                </span>

                Technical Specifications &
                Acceptance Criteria
              </h2>

              <span>
                NOVA API
              </span>
            </div>

            <div className="task-description">
              <p>
                {task.description}
              </p>

              {task.technicalSpecifications && (
                <div className="task-threat-model">
                  <h3>
                    Technical Specifications
                  </h3>

                  <p>
                    {Array.isArray(
                      task.technicalSpecifications
                    )
                      ? task.technicalSpecifications.join(
                          " "
                        )
                      : task.technicalSpecifications}
                  </p>
                </div>
              )}

              {task.threatModel.length >
                0 && (
                <div className="task-threat-model">
                  <h3>
                    Primary Threat Model &
                    Security Mitigations
                  </h3>

                  <ul>
                    {task.threatModel.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          {typeof item ===
                          "string"
                            ? item
                            : item.title ||
                              item.description ||
                              JSON.stringify(
                                item
                              )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <div className="task-acceptance">
                <div className="task-acceptance-heading">
                  <h3>
                    <span className="material-symbols-outlined">
                      verified
                    </span>

                    Acceptance Criteria
                  </h3>

                  <span>
                    {
                      task
                        .acceptanceCriteria
                        .length
                    }{" "}
                    Defined
                  </span>
                </div>

                <div className="task-criteria-list">
                  {task.acceptanceCriteria
                    .length === 0 ? (
                    <div className="task-no-activity">
                      No acceptance criteria
                      defined yet.
                    </div>
                  ) : (
                    task.acceptanceCriteria.map(
                      (
                        criterion,
                        index
                      ) => (
                        <div
                          className="task-criterion"
                          key={`${criterion}-${index}`}
                        >
                          <span className="task-criterion-number">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span>
                            {typeof criterion ===
                            "string"
                              ? criterion
                              : criterion.title ||
                                criterion.description ||
                                JSON.stringify(
                                  criterion
                                )}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="task-subtasks-card">
            <div className="task-section-heading">
              <h2>
                <span className="material-symbols-outlined">
                  checklist
                </span>

                Subtasks
              </h2>

              <button
                onClick={
                  handleAddSubtask
                }
                disabled={addingSubtask}
              >
                <span className="material-symbols-outlined">
                  add
                </span>

                {addingSubtask
                  ? "Adding..."
                  : "Add subtask"}
              </button>
            </div>

            <div className="task-subtask-progress">
              <div>
                <span>
                  {completedSubtasks} of{" "}
                  {subtasks.length}{" "}
                  completed
                </span>

                <strong>
                  {subtaskPercentage}%
                </strong>
              </div>

              <div className="task-progress-track">
                <span
                  style={{
                    width: `${subtaskPercentage}%`,
                  }}
                ></span>
              </div>
            </div>

            <div className="task-subtask-list">
              {subtasks.length === 0 ? (
                <div className="task-no-activity">
                  <span className="material-symbols-outlined">
                    checklist
                  </span>

                  No subtasks yet.
                </div>
              ) : (
                subtasks.map(
                  (subtask) => (
                    <label
                      className={`task-subtask ${
                        subtask.done
                          ? "completed"
                          : ""
                      }`}
                      key={subtask.id}
                    >
                      <input
                        type="checkbox"
                        checked={
                          subtask.done
                        }
                        disabled={
                          updatingSubtaskId ===
                          subtask.id
                        }
                        onChange={() =>
                          handleToggleSubtask(
                            subtask
                          )
                        }
                      />

                      <span>
                        {subtask.title}
                      </span>

                      <small>
                        {subtask.done
                          ? "Done"
                          : "Todo"}
                      </small>
                    </label>
                  )
                )
              )}
            </div>
          </section>

          <section className="task-activity-card">
            <div className="task-activity-header">
              <h2>
                <span className="material-symbols-outlined">
                  forum
                </span>

                Activity & Discussion
                Stream
              </h2>

              <div className="task-activity-filters">
                {[
                  "All",
                  "Comments",
                  "Git",
                ].map(
                  (filter) => (
                    <button
                      key={filter}
                      className={
                        activityFilter ===
                        filter
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActivityFilter(
                          filter
                        )
                      }
                    >
                      {filter}

                      {filter ===
                        "All" &&
                        ` (${allActivity.length})`}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="task-timeline">
              {visibleActivity.length ===
                0 && (
                <div className="task-no-activity">
                  <span className="material-symbols-outlined">
                    forum
                  </span>

                  No activity yet.
                </div>
              )}

              {visibleActivity.map(
                (item, index) => (
                  <article
                    className="task-activity-item"
                    key={
                      item._id ||
                      `${item.name}-${item.time}-${index}`
                    }
                  >
                    <div className="task-activity-avatar">
                      {item.initials}
                    </div>

                    <div className="task-activity-content">
                      <div className="task-activity-top">
                        <div>
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.role}
                          </span>
                        </div>

                        <time>
                          {item.time ||
                            formatDateTime(
                              item.createdAt
                            )}
                        </time>
                      </div>

                      <p>
                        {item.text}
                      </p>

                      {item.type ===
                        "git" && (
                        <div className="task-git-event">
                          <span className="material-symbols-outlined">
                            smart_toy
                          </span>

                          GitHub Webhook
                          event
                        </div>
                      )}

                      {item.type ===
                        "status" && (
                        <div className="task-git-event">
                          <span className="material-symbols-outlined">
                            sync
                          </span>

                          Status activity
                        </div>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>

            <div className="task-comment-composer">
              <div className="task-composer-top">
                <div className="task-current-user">
                  <span>
                    {currentUserInitials}
                  </span>

                  <span>
                    {currentUserName}{" "}
                    commenting
                  </span>
                </div>

                <div className="task-formatting-tools">
                  <button
                    type="button"
                    title="Bold"
                    onClick={() =>
                      showToast(
                        "Markdown formatting supported."
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      format_bold
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Italic"
                    onClick={() =>
                      showToast(
                        "Markdown formatting supported."
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      format_italic
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Code"
                    onClick={() =>
                      showToast(
                        "Markdown formatting supported."
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      code
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Mention"
                    onClick={() =>
                      setComment(
                        (current) =>
                          `${current}@`
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      alternate_email
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Attach"
                    onClick={() =>
                      showToast(
                        "File attachments will be added later."
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      attach_file
                    </span>
                  </button>
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleCommentKeyDown
                }
                placeholder="Leave a comment or type @ to mention team members..."
                rows="4"
                disabled={
                  postingComment
                }
              ></textarea>

              <div className="task-composer-footer">
                <span>
                  Supports GitHub flavored
                  markdown
                </span>

                <div>
                  <kbd>
                    ⌘ + Enter
                  </kbd>

                  <button
                    className="nova-button nova-button-primary"
                    onClick={
                      handlePostComment
                    }
                    disabled={
                      postingComment
                    }
                  >
                    <span className="material-symbols-outlined">
                      send
                    </span>

                    {postingComment
                      ? "Posting..."
                      : "Send Comment"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="task-details-sidebar">
          <section className="task-sidebar-card">
            <div className="task-sidebar-heading">
              <h2>
                Properties
              </h2>

              <button
                onClick={() =>
                  showToast(
                    "Property customisation selected."
                  )
                }
              >
                Customise
              </button>
            </div>

            <div className="task-properties">
              <div className="task-property">
                <span>
                  Status
                </span>

                <select
                  value={status}
                  onChange={
                    handleStatusChange
                  }
                  disabled={
                    savingStatus
                  }
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="task-property">
                <span>
                  Assignee
                </span>

                <button className="task-person-control">
                  <span className="task-small-avatar">
                    {getInitials(
                      task.assignee
                    )}
                  </span>

                  {task.assignee}

                  {task.assigneeId && (
                    <span className="task-online-dot"></span>
                  )}
                </button>
              </div>

              <div className="task-property">
                <span>
                  Reviewer
                </span>

                <button className="task-person-control">
                  <span className="task-small-avatar reviewer">
                    {getInitials(
                      task.reviewer
                    )}
                  </span>

                  {task.reviewer}
                </button>
              </div>

              <div className="task-property">
                <span>
                  Sprint
                </span>

                <strong className="task-sprint-value">
                  <span className="material-symbols-outlined">
                    sync
                  </span>

                  {task.sprint}

                  {task.sprintProgress
                    ? ` (${task.sprintProgress})`
                    : ""}
                </strong>
              </div>

              <div className="task-property">
                <span>
                  Story Points
                </span>

                <div className="task-points">
                  <strong>
                    {task.storyPoints} pts
                  </strong>

                  <small>
                    {estimateHours
                      ? `(~${estimateHours}h est)`
                      : "(estimate not set)"}
                  </small>
                </div>
              </div>

              <div className="task-property">
                <span>
                  Due Date
                </span>

                <strong className="task-due-date">
                  <span className="material-symbols-outlined">
                    event
                  </span>

                  {formatDate(
                    task.dueDate
                  )}
                </strong>
              </div>

              <div className="task-property">
                <span>
                  Priority
                </span>

                <select
                  value={priority}
                  onChange={
                    handlePriorityChange
                  }
                  disabled={
                    savingPriority
                  }
                >
                  {PRIORITY_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label} -{" "}
                        {option.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="task-label-property">
                <span>
                  Labels
                </span>

                <div>
                  {task.labels.map(
                    (label) => (
                      <span
                        key={label}
                      >
                        #{label}
                      </span>
                    )
                  )}

                  <button
                    onClick={() =>
                      showToast(
                        "Add label functionality will be connected next."
                      )
                    }
                  >
                    <span className="material-symbols-outlined">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="task-sidebar-card">
            <div className="task-sidebar-heading">
              <h2>
                <span className="material-symbols-outlined">
                  timer
                </span>

                Time Logged
              </h2>

              <button
                onClick={() =>
                  setShowTimeModal(
                    true
                  )
                }
              >
                + Log Time
              </button>
            </div>

            <div className="task-time-summary">
              <div>
                <strong>
                  {loggedHours}h
                </strong>

                <span>
                  {estimateHours
                    ? ` / ${estimateHours}h est`
                    : " / no estimate"}
                </span>
              </div>

              <small>
                {timePercentage}% of estimate
              </small>
            </div>

            <div className="task-mini-chart">
              <span
                style={{
                  height: "30%",
                }}
              ></span>

              <span
                style={{
                  height: "45%",
                }}
              ></span>

              <span
                className="highlight"
                style={{
                  height: `${Math.max(
                    20,
                    timePercentage
                  )}%`,
                }}
              ></span>

              <span
                className="today"
                style={{
                  height: "42%",
                }}
              ></span>

              <span
                style={{
                  height: "25%",
                }}
              ></span>
            </div>

            <div className="task-chart-labels">
              <span>
                Mon
              </span>

              <span>
                Tue
              </span>

              <span>
                Wed
              </span>

              <span>
                Today
              </span>

              <span>
                Fri
              </span>
            </div>
          </section>

          <section className="task-sidebar-card">
            <h2 className="task-sidebar-title">
              <span className="material-symbols-outlined">
                cloud_done
              </span>

              Environment &
              Observability
            </h2>

            <div className="task-environment">
              <div className="task-environment-header">
                <span>
                  {task.environment}
                </span>

                <strong>
                  <span></span>

                  {task.environmentStatus}

                  {task.environmentVersion
                    ? ` (${task.environmentVersion})`
                    : ""}
                </strong>
              </div>

              <code>
                {task.observability ||
                  task.endpoint ||
                  "No observability configuration"}
              </code>
            </div>

            <div className="task-observability-row">
              <span>
                <span className="material-symbols-outlined">
                  monitoring
                </span>

                Observability
              </span>

              <strong>
                {task.observability ||
                  "Configured"}
              </strong>
            </div>

            {task.endpoint && (
              <div className="task-endpoint">
                <span>
                  Target Endpoint Contract
                </span>

                <code>
                  {task.endpoint}
                </code>
              </div>
            )}

            {task.branch && (
              <div className="task-endpoint">
                <span>
                  Branch
                </span>

                <code>
                  {task.branch}
                </code>
              </div>
            )}

            {task.pullRequestUrl && (
              <div className="task-endpoint">
                <span>
                  Pull Request
                </span>

                <a
                  href={
                    task.pullRequestUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Pull Request
                </a>
              </div>
            )}
          </section>

          <section className="task-sidebar-card">
            <h2 className="task-sidebar-title">
              <span className="material-symbols-outlined">
                account_tree
              </span>

              Dependencies (
              {task.dependencies.length})
            </h2>

            <div className="task-dependencies">
              {task.dependencies.length ===
                0 && (
                <div className="task-no-dependencies">
                  No dependencies.
                </div>
              )}

              {task.dependencies.map(
                (dependency) => {
                  const dependencyId =
                    getId(
                      dependency
                    );

                  const dependencyKey =
                    dependency.key ||
                    dependency.id ||
                    dependencyId;

                  const dependencyTitle =
                    dependency.title ||
                    "Task dependency";

                  const dependencyStatus =
                    dependency.status ||
                    "Unknown";

                  return (
                    <div
                      className="task-dependency"
                      key={
                        dependencyId ||
                        dependencyKey
                      }
                    >
                      <div>
                        <strong
                          className={
                            dependencyStatus ===
                              "Done" ||
                            dependencyStatus ===
                              "Resolved"
                              ? "resolved"
                              : "blocking"
                          }
                        >
                          {dependencyStatus ===
                            "Done" ||
                          dependencyStatus ===
                            "Resolved"
                            ? "✓"
                            : "→"}
                        </strong>

                        <span>
                          {
                            dependencyKey
                          }
                        </span>

                        <small>
                          {
                            dependencyTitle
                          }
                        </small>
                      </div>

                      <em
                        className={
                          dependencyStatus !==
                            "Done" &&
                          dependencyStatus !==
                            "Resolved"
                            ? "blocking"
                            : ""
                        }
                      >
                        {
                          dependencyStatus
                        }
                      </em>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </aside>
      </div>

      {showTimeModal && (
        <div
          className="nova-modal-overlay"
          onMouseDown={() =>
            !loggingTime &&
            setShowTimeModal(false)
          }
        >
          <div
            className="nova-modal task-time-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="nova-modal-header">
              <div>
                <span className="nova-label-sm">
                  TIME TRACKING
                </span>

                <h2 className="nova-headline-md">
                  Log Time
                </h2>
              </div>

              <button
                className="nova-modal-close"
                onClick={() =>
                  setShowTimeModal(false)
                }
                disabled={
                  loggingTime
                }
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="task-time-form">
              <label>
                <span>
                  Hours
                </span>

                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={timeHours}
                  onChange={(event) =>
                    setTimeHours(
                      event.target.value
                    )
                  }
                  disabled={
                    loggingTime
                  }
                />
              </label>

              <label>
                <span>
                  Description
                </span>

                <textarea
                  rows="3"
                  value={
                    timeDescription
                  }
                  onChange={(event) =>
                    setTimeDescription(
                      event.target.value
                    )
                  }
                  placeholder="What did you work on?"
                  disabled={
                    loggingTime
                  }
                ></textarea>
              </label>

              <div className="task-time-actions">
                <button
                  className="nova-button nova-button-secondary"
                  onClick={() =>
                    setShowTimeModal(
                      false
                    )
                  }
                  disabled={
                    loggingTime
                  }
                >
                  Cancel
                </button>

                <button
                  className="nova-button nova-button-primary"
                  onClick={
                    handleLogTime
                  }
                  disabled={
                    loggingTime
                  }
                >
                  <span className="material-symbols-outlined">
                    timer
                  </span>

                  {loggingTime
                    ? "Logging..."
                    : "Log Time"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetails;