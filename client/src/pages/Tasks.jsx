import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import taskService from "../services/taskService";
import projectService from "../services/projectService";
import "../styles/tasks.css";

const COLUMNS = [
  {
    id: "Backlog",
    title: "Backlog",
    description: "Ideas and upcoming work",
    icon: "inventory_2",
  },
  {
    id: "To Do",
    title: "To Do",
    description: "Ready to be started",
    icon: "radio_button_unchecked",
  },
  {
    id: "In Progress",
    title: "In Progress",
    description: "Currently being worked on",
    icon: "play_circle",
    className: "kanban-in-progress",
  },
  {
    id: "In Review",
    title: "In Review",
    description: "Waiting for review",
    icon: "rate_review",
    className: "kanban-review",
  },
  {
    id: "Done",
    title: "Done",
    description: "Completed work",
    icon: "check_circle",
    className: "kanban-done",
  },
];

const PRIORITIES = [
  {
    id: "P0",
    label: "P0",
    name: "Blocker",
    icon: "priority_high",
    className: "priority-p0",
  },
  {
    id: "P1",
    label: "P1",
    name: "High",
    icon: "keyboard_double_arrow_up",
    className: "priority-p1",
  },
  {
    id: "P2",
    label: "P2",
    name: "Normal",
    icon: "drag_handle",
    className: "priority-p2",
  },
  {
    id: "P3",
    label: "P3",
    name: "Low",
    icon: "keyboard_double_arrow_down",
    className: "priority-p3",
  },
];

const STATUS_OPTIONS = COLUMNS.map((column) => column.id);

const EMPTY_FORM = {
  title: "",
  description: "",
  project: "",
  status: "Backlog",
  priority: "P2",
  storyPoints: "",
  assignee: "",
  dueDate: "",
  sprint: "",
  labels: "",
};

function getId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id || value.id || "";
}

function getDisplayName(user) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return user;
  }

  return (
    user.name ||
    user.fullName ||
    user.username ||
    user.email ||
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

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dateValue, status) {
  if (!dateValue || status === "Done") {
    return false;
  }

  const due = new Date(dateValue);
  due.setHours(23, 59, 59, 999);

  return due.getTime() < Date.now();
}

function normalizeTask(task) {
  const project =
    task?.project && typeof task.project === "object"
      ? task.project
      : null;

  const assignee =
    task?.assignee && typeof task.assignee === "object"
      ? task.assignee
      : null;

  return {
    ...task,
    mongoId: task?._id || task?.id || "",
    key: task?.key || "TASK",
    title: task?.title || "Untitled task",
    description: task?.description || "",
    status: task?.status || "Backlog",
    priority: task?.priority || "P2",
    projectId: getId(task?.project),
    projectName:
      project?.name ||
      project?.key ||
      (typeof task?.project === "string"
        ? task.project
        : "Unassigned project"),
    projectKey: project?.key || "",
    assigneeName: getDisplayName(task?.assignee),
    assigneeId: getId(task?.assignee),
    dueDate: task?.dueDate || "",
    labels: Array.isArray(task?.labels) ? task.labels : [],
    storyPoints: Number(task?.storyPoints || 0),
    sprint: task?.sprint || "",
  };
}

function getPriorityConfig(priority) {
  return (
    PRIORITIES.find((item) => item.id === priority) ||
    PRIORITIES[2]
  );
}

function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");

  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await taskService.getTasks({
        archived: false,
        sort: "-updatedAt",
      });

      const receivedTasks = Array.isArray(response)
        ? response
        : Array.isArray(response?.tasks)
          ? response.tasks
          : Array.isArray(response?.data)
            ? response.data
            : [];

      setTasks(receivedTasks.map(normalizeTask));
    } catch (err) {
      console.error("Failed to load tasks:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load tasks. Make sure the backend server is running."
      );

      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);

      const response = await projectService.getProjects({
        isArchived: false,
      });

      const receivedProjects = Array.isArray(response)
        ? response
        : Array.isArray(response?.projects)
          ? response.projects
          : Array.isArray(response?.data)
            ? response.data
            : [];

      setProjects(receivedProjects);

      if (receivedProjects.length > 0) {
        setForm((current) => ({
          ...current,
          project:
            current.project ||
            getId(receivedProjects[0]),
        }));
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [loadTasks, loadProjects]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchableText = [
        task.key,
        task.title,
        task.description,
        task.projectName,
        task.projectKey,
        task.assigneeName,
        task.sprint,
        ...(task.labels || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesProject =
        !projectFilter ||
        task.projectId === projectFilter;

      const matchesPriority =
        !priorityFilter ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesProject &&
        matchesPriority
      );
    });
  }, [
    tasks,
    search,
    projectFilter,
    priorityFilter,
  ]);

  const tasksByColumn = useMemo(() => {
    const grouped = {};

    COLUMNS.forEach((column) => {
      grouped[column.id] = [];
    });

    filteredTasks.forEach((task) => {
      if (!grouped[task.status]) {
        grouped[task.status] = [];
      }

      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const metrics = useMemo(() => {
    const total = filteredTasks.length;

    const inProgress = filteredTasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const inReview = filteredTasks.filter(
      (task) => task.status === "In Review"
    ).length;

    const completed = filteredTasks.filter(
      (task) => task.status === "Done"
    ).length;

    const totalStoryPoints = filteredTasks.reduce(
      (sum, task) => sum + Number(task.storyPoints || 0),
      0
    );

    const completedStoryPoints = filteredTasks
      .filter((task) => task.status === "Done")
      .reduce(
        (sum, task) =>
          sum + Number(task.storyPoints || 0),
        0
      );

    const completionPercentage =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    return {
      total,
      inProgress,
      inReview,
      completed,
      completionPercentage,
      totalStoryPoints,
      completedStoryPoints,
    };
  }, [filteredTasks]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
  };

  const resetCreateForm = () => {
    setForm({
      ...EMPTY_FORM,
      project:
        projects.length > 0
          ? getId(projects[0])
          : "",
    });

    setFormError("");
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    setCreateModalOpen(false);
    setFormError("");
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!form.project) {
      setFormError("Please select a project.");
      return;
    }

    try {
      setCreating(true);
      setFormError("");

      const labels = form.labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project,
        status: form.status,
        priority: form.priority,
        storyPoints: form.storyPoints
          ? Number(form.storyPoints)
          : 0,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
        sprint: form.sprint.trim(),
        labels,
      };

      const response =
        await taskService.createTask(payload);

      const createdTask =
        response?.task ||
        response?.data ||
        response;

      if (createdTask?._id || createdTask?.id) {
        setTasks((current) => [
          normalizeTask(createdTask),
          ...current,
        ]);
      } else {
        await loadTasks();
      }

      setCreateModalOpen(false);
      resetCreateForm();
    } catch (err) {
      console.error("Failed to create task:", err);

      setFormError(
        err?.response?.data?.message ||
          "Unable to create the task."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (event, task) => {
    setDraggedTaskId(task.mongoId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      task.mongoId
    );
  };

  const handleDragEnd = () => {
    setDraggedTaskId("");
    setDragOverColumn("");
  };

  const handleDragOver = (event, columnId) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = async (event, columnId) => {
    event.preventDefault();

    const taskId =
      draggedTaskId ||
      event.dataTransfer.getData("text/plain");

    setDragOverColumn("");

    if (!taskId) {
      return;
    }

    const task = tasks.find(
      (item) => item.mongoId === taskId
    );

    if (!task || task.status === columnId) {
      setDraggedTaskId("");
      return;
    }

    const previousStatus = task.status;

    setTasks((current) =>
      current.map((item) =>
        item.mongoId === taskId
          ? {
              ...item,
              status: columnId,
            }
          : item
      )
    );

    setDraggedTaskId("");

    try {
      await taskService.updateTaskStatus(
        taskId,
        columnId
      );
    } catch (err) {
      console.error(
        "Failed to update task status:",
        err
      );

      setTasks((current) =>
        current.map((item) =>
          item.mongoId === taskId
            ? {
                ...item,
                status: previousStatus,
              }
            : item
        )
      );
    }
  };

  const handleTaskClick = (task) => {
    if (!task.mongoId) {
      return;
    }

    navigate(`/tasks/${task.mongoId}`);
  };

  const clearFilters = () => {
    setSearch("");
    setProjectFilter("");
    setPriorityFilter("");
  };

  const hasFilters =
    search ||
    projectFilter ||
    priorityFilter;

  return (
    <main className="tasks-page">
      <div className="tasks-header">
        <div className="tasks-breadcrumb">
          <span>NOVA</span>

          <span className="tasks-breadcrumb-separator">
            /
          </span>

          <span className="tasks-breadcrumb-current">
            TASKS
          </span>
        </div>

        <div className="tasks-title-row">
          <div>
            <p className="tasks-eyebrow nova-label-sm">
              WORKSPACE / TASK MANAGEMENT
            </p>

            <h1 className="nova-display">
              Task Board
            </h1>

            <p className="tasks-description nova-body-md">
              Plan, prioritize, and deliver work across
              your active projects.
            </p>
          </div>

          <button
            type="button"
            className="nova-button nova-button-primary tasks-new-button"
            onClick={openCreateModal}
          >
            <span className="material-symbols-outlined">
              add
            </span>

            Add Task
          </button>
        </div>
      </div>

      <section className="tasks-metrics">
        <div className="task-metric">
          <div className="task-metric-icon task-metric-icon-primary">
            <span className="material-symbols-outlined">
              checklist
            </span>
          </div>

          <div>
            <strong>{metrics.total}</strong>

            <span className="nova-label-sm text-muted">
              Total Tasks
            </span>
          </div>
        </div>

        <div className="task-metric">
          <div className="task-metric-icon task-metric-icon-secondary">
            <span className="material-symbols-outlined">
              pending_actions
            </span>
          </div>

          <div>
            <strong>{metrics.inProgress}</strong>

            <span className="nova-label-sm text-muted">
              In Progress
            </span>
          </div>
        </div>

        <div className="task-metric">
          <div className="task-metric-icon task-metric-icon-primary">
            <span className="material-symbols-outlined">
              rate_review
            </span>
          </div>

          <div>
            <strong>{metrics.inReview}</strong>

            <span className="nova-label-sm text-muted">
              In Review
            </span>
          </div>
        </div>

        <div className="task-metric">
          <div className="task-metric-icon task-metric-icon-tertiary">
            <span className="material-symbols-outlined">
              task_alt
            </span>
          </div>

          <div>
            <strong>
              {metrics.completionPercentage}%
            </strong>

            <span className="nova-label-sm text-muted">
              Completed
            </span>
          </div>
        </div>

        <div className="task-metric">
          <div className="task-metric-icon task-metric-icon-secondary">
            <span className="material-symbols-outlined">
              military_tech
            </span>
          </div>

          <div>
            <strong>
              {metrics.completedStoryPoints}/
              {metrics.totalStoryPoints}
            </strong>

            <span className="nova-label-sm text-muted">
              Story Points
            </span>
          </div>
        </div>
      </section>

      <section className="tasks-toolbar">
        <div className="tasks-search">
          <span className="material-symbols-outlined">
            search
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search tasks, keys, descriptions..."
            aria-label="Search tasks"
          />

          <kbd>⌘ K</kbd>
        </div>

        <div className="tasks-filter-group">
          <select
            value={projectFilter}
            onChange={(event) =>
              setProjectFilter(event.target.value)
            }
            aria-label="Filter by project"
          >
            <option value="">
              All Projects
            </option>

            {projects.map((project) => {
              const projectId = getId(project);

              return (
                <option
                  key={projectId || project.key}
                  value={projectId}
                >
                  {project.name || project.key}
                </option>
              );
            })}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            aria-label="Filter by priority"
          >
            <option value="">
              All Priorities
            </option>

            {PRIORITIES.map((priority) => (
              <option
                key={priority.id}
                value={priority.id}
              >
                {priority.label} - {priority.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              className="tasks-clear-filter"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="nova-alert nova-alert-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <div>
            <strong>Unable to load tasks</strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            className="nova-button nova-button-secondary"
            onClick={loadTasks}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="kanban-board">
          {COLUMNS.map((column) => (
            <section
              className="kanban-column"
              key={column.id}
            >
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <div className="kanban-column-icon">
                    <span className="material-symbols-outlined">
                      {column.icon}
                    </span>
                  </div>

                  <h2>{column.title}</h2>

                  <span className="kanban-count">
                    —
                  </span>
                </div>
              </div>

              <div className="kanban-column-body">
                <div className="kanban-empty">
                  <span className="material-symbols-outlined">
                    progress_activity
                  </span>

                  Loading tasks...
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="kanban-board">
          {COLUMNS.map((column) => {
            const columnTasks =
              tasksByColumn[column.id] || [];

            return (
              <section
                key={column.id}
                className={`kanban-column ${
                  dragOverColumn === column.id
                    ? "kanban-column-drag-active"
                    : ""
                }`}
                onDragOver={(event) =>
                  handleDragOver(event, column.id)
                }
                onDrop={(event) =>
                  handleDrop(event, column.id)
                }
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <div
                      className={`kanban-column-icon ${
                        column.className || ""
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {column.icon}
                      </span>
                    </div>

                    <h2>{column.title}</h2>

                    <span className="kanban-count">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="kanban-column-menu"
                    title={`${column.title} options`}
                    onClick={openCreateModal}
                  >
                    <span className="material-symbols-outlined">
                      more_horiz
                    </span>
                  </button>
                </div>

                <div className="kanban-column-body">
                  {columnTasks.length === 0 ? (
                    <div className="kanban-empty">
                      <span className="material-symbols-outlined">
                        inbox
                      </span>

                      <span>
                        {hasFilters
                          ? "No matching tasks"
                          : "No tasks here"}
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priority =
                        getPriorityConfig(
                          task.priority
                        );

                      const overdue = isOverdue(
                        task.dueDate,
                        task.status
                      );

                      return (
                        <article
                          key={task.mongoId || task.key}
                          className={`kanban-task-card ${
                            draggedTaskId ===
                            task.mongoId
                              ? "kanban-task-dragging"
                              : ""
                          }`}
                          draggable
                          onDragStart={(event) =>
                            handleDragStart(
                              event,
                              task
                            )
                          }
                          onDragEnd={handleDragEnd}
                          onClick={() =>
                            handleTaskClick(task)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              handleTaskClick(task);
                            }
                          }}
                        >
                          <div className="task-card-topline">
                            <span className="task-card-id">
                              {task.key}
                            </span>

                            <span
                              className={`task-priority ${priority.className}`}
                            >
                              <span className="material-symbols-outlined">
                                {priority.icon}
                              </span>

                              {priority.label}
                            </span>
                          </div>

                          <h3>{task.title}</h3>

                          {task.description && (
                            <p className="task-card-description">
                              {task.description}
                            </p>
                          )}

                          <div className="task-card-project">
                            <span className="material-symbols-outlined">
                              folder
                            </span>

                            <span>
                              {task.projectName}
                            </span>

                            {task.projectKey && (
                              <span className="task-project-code">
                                {task.projectKey}
                              </span>
                            )}
                          </div>

                          {task.labels.length > 0 && (
                            <div className="task-card-labels">
                              {task.labels
                                .slice(0, 3)
                                .map((label) => (
                                  <span
                                    key={label}
                                  >
                                    {label}
                                  </span>
                                ))}

                              {task.labels.length >
                                3 && (
                                <span>
                                  +
                                  {task.labels.length -
                                    3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="task-card-footer">
                            <div className="task-assignee">
                              <span className="task-avatar">
                                {getInitials(
                                  task.assigneeName
                                )}
                              </span>

                              <span>
                                {task.assigneeName ||
                                  "Unassigned"}
                              </span>
                            </div>

                            <div className="task-card-meta">
                              {task.dueDate && (
                                <span
                                  className={
                                    overdue
                                      ? "text-error"
                                      : ""
                                  }
                                  title={
                                    overdue
                                      ? "Overdue"
                                      : "Due date"
                                  }
                                >
                                  <span className="material-symbols-outlined">
                                    event
                                  </span>

                                  {formatDate(
                                    task.dueDate
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="task-card-bottom">
                            {task.storyPoints > 0 && (
                              <span>
                                <span className="material-symbols-outlined">
                                  military_tech
                                </span>

                                {task.storyPoints} SP
                              </span>
                            )}

                            {task.sprint && (
                              <span>
                                <span className="material-symbols-outlined">
                                  sprint
                                </span>

                                {task.sprint}
                              </span>
                            )}

                            <span className="task-card-open">
                              <span className="material-symbols-outlined">
                                arrow_outward
                              </span>
                            </span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </section>
      )}

      <footer className="tasks-board-footer">
        <div className="tasks-footer-status">
          <span />

          <span>
            {loading
              ? "Synchronizing workspace..."
              : "Task board synchronized"}
          </span>
        </div>

        <span className="nova-code">
          {filteredTasks.length} of {tasks.length} tasks
          visible
        </span>
      </footer>

      {createModalOpen && (
        <div
          className="nova-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            className="nova-modal tasks-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
          >
            <div className="nova-modal-header">
              <div>
                <p className="nova-label-sm text-brand">
                  TASK MANAGEMENT
                </p>

                <h2
                  id="create-task-title"
                  className="nova-headline-md"
                >
                  Create New Task
                </h2>

                <p className="nova-body-sm text-muted">
                  Add work to a project and place it
                  directly on the board.
                </p>
              </div>

              <button
                type="button"
                className="nova-icon-button"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <form
              className="tasks-create-form"
              onSubmit={handleCreateTask}
            >
              <label>
                <span>Task Title</span>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Implement Redis token cache"
                  autoFocus
                  required
                />
              </label>

              <label>
                <span>Description</span>

                <input
                  type="text"
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the work to be completed"
                />
              </label>

              <div className="tasks-form-grid">
                <label>
                  <span>Project</span>

                  <select
                    value={form.project}
                    onChange={(event) =>
                      updateForm(
                        "project",
                        event.target.value
                      )
                    }
                    disabled={projectsLoading}
                    required
                  >
                    <option value="">
                      {projectsLoading
                        ? "Loading projects..."
                        : "Select project"}
                    </option>

                    {projects.map((project) => {
                      const projectId =
                        getId(project);

                      return (
                        <option
                          key={
                            projectId ||
                            project.key
                          }
                          value={projectId}
                        >
                          {project.name ||
                            project.key}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span>Status</span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value
                      )
                    }
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <div className="tasks-form-grid">
                <label>
                  <span>Priority</span>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target.value
                      )
                    }
                  >
                    {PRIORITIES.map(
                      (priority) => (
                        <option
                          key={priority.id}
                          value={priority.id}
                        >
                          {priority.label} -{" "}
                          {priority.name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>Story Points</span>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.storyPoints}
                    onChange={(event) =>
                      updateForm(
                        "storyPoints",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 5"
                  />
                </label>
              </div>

              <div className="tasks-form-grid">
                <label>
                  <span>Assignee</span>

                  <input
                    type="text"
                    value={form.assignee}
                    onChange={(event) =>
                      updateForm(
                        "assignee",
                        event.target.value
                      )
                    }
                    placeholder="User ID"
                  />
                </label>

                <label>
                  <span>Due Date</span>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateForm(
                        "dueDate",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="tasks-form-grid">
                <label>
                  <span>Sprint</span>

                  <input
                    type="text"
                    value={form.sprint}
                    onChange={(event) =>
                      updateForm(
                        "sprint",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Sprint 34"
                  />
                </label>

                <label>
                  <span>Labels</span>

                  <input
                    type="text"
                    value={form.labels}
                    onChange={(event) =>
                      updateForm(
                        "labels",
                        event.target.value
                      )
                    }
                    placeholder="backend, security"
                  />
                </label>
              </div>

              {formError && (
                <div className="nova-alert nova-alert-error">
                  <span className="material-symbols-outlined">
                    error
                  </span>

                  <span>{formError}</span>
                </div>
              )}

              <div className="tasks-create-actions">
                <button
                  type="button"
                  className="nova-button nova-button-secondary"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="nova-button nova-button-primary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="material-symbols-outlined">
                        progress_activity
                      </span>

                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        add_task
                      </span>

                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Tasks;