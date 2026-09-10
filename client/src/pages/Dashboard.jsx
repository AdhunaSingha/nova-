import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import projectService from "../services/projectService";
import taskService from "../services/taskService";
import { useAuth } from "../context/AuthContext";

import "../styles/dashboard.css";

const STATUS_ORDER = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Done",
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

function relativeTime(dateValue) {
  if (!dateValue) {
    return "Recently";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatDate(dateValue);
}

function normalizeProject(project) {
  const projectId = getId(project);

  return {
    ...project,

    mongoId: projectId,

    name:
      project?.name ||
      "Untitled Project",

    key:
      project?.key ||
      "PROJECT",

    progress: Number(
      project?.progress || 0
    ),

    status:
      project?.status ||
      "Planning",

    priority:
      project?.priority ||
      "Medium",

    category:
      project?.category ||
      "Other",

    deadline:
      project?.deadline ||
      "",

    members:
      Array.isArray(project?.members)
        ? project.members
        : [],
  };
}

function normalizeTask(task) {
  const project =
    task?.project &&
    typeof task.project === "object"
      ? task.project
      : null;

  const assignee =
    task?.assignee &&
    typeof task.assignee === "object"
      ? task.assignee
      : null;

  const activity =
    Array.isArray(task?.activities)
      ? task.activities
      : [];

  return {
    ...task,

    mongoId:
      task?._id ||
      task?.id ||
      "",

    key:
      task?.key ||
      "TASK",

    title:
      task?.title ||
      "Untitled task",

    status:
      task?.status ||
      "Backlog",

    priority:
      task?.priority ||
      "P2",

    storyPoints: Number(
      task?.storyPoints || 0
    ),

    projectId:
      getId(project || task?.project),

    projectName:
      project?.name ||
      project?.key ||
      "Project",

    assigneeName:
      getName(assignee) ||
      "Unassigned",

    activities: activity,
  };
}

function getProjectStatus(project) {
  if (!project) {
    return {
      label: "Planning",
      type: "neutral",
    };
  }

  if (
    project.status === "Completed"
  ) {
    return {
      label: "Completed",
      type: "success",
    };
  }

  if (
    project.status === "On Hold" ||
    project.priority === "Critical"
  ) {
    return {
      label:
        project.status === "On Hold"
          ? "On Hold"
          : "At Risk",
      type: "warning",
    };
  }

  if (
    project.status === "Active"
  ) {
    return {
      label: "On Track",
      type: "success",
    };
  }

  return {
    label: project.status,
    type: "neutral",
  };
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          projectsResponse,
          tasksResponse,
        ] = await Promise.all([
          projectService.getProjects({
            isArchived: false,
          }),

          taskService.getTasks({
            archived: false,
            sort: "-updatedAt",
          }),
        ]);

        const receivedProjects =
          Array.isArray(projectsResponse)
            ? projectsResponse
            : Array.isArray(
                  projectsResponse?.projects
                )
              ? projectsResponse.projects
              : Array.isArray(
                    projectsResponse?.data
                  )
                ? projectsResponse.data
                : [];

        const receivedTasks =
          Array.isArray(tasksResponse)
            ? tasksResponse
            : Array.isArray(
                  tasksResponse?.tasks
                )
              ? tasksResponse.tasks
              : Array.isArray(
                    tasksResponse?.data
                  )
                ? tasksResponse.data
                : [];

        setProjects(
          receivedProjects.map(
            normalizeProject
          )
        );

        setTasks(
          receivedTasks.map(
            normalizeTask
          )
        );
      } catch (err) {
        console.error(
          "Failed to load dashboard:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status === "Active"
      ),
    [projects]
  );

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status !== "Done"
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === "Done"
      ),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status ===
          "In Progress"
      ),
    [tasks]
  );

  const inReviewTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status ===
          "In Review"
      ),
    [tasks]
  );

  const totalStoryPoints = useMemo(
    () =>
      tasks.reduce(
        (sum, task) =>
          sum +
          Number(
            task.storyPoints || 0
          ),
        0
      ),
    [tasks]
  );

  const completedStoryPoints =
    useMemo(
      () =>
        completedTasks.reduce(
          (sum, task) =>
            sum +
            Number(
              task.storyPoints || 0
            ),
          0
        ),
      [completedTasks]
    );

  const completionPercentage =
    useMemo(() => {
      if (!tasks.length) {
        return 0;
      }

      return Math.round(
        (completedTasks.length /
          tasks.length) *
          100
      );
    }, [
      tasks.length,
      completedTasks.length,
    ]);

  const teamMemberCount =
    useMemo(() => {
      const members = new Set();

      projects.forEach((project) => {
        project.members.forEach(
          (member) => {
            const memberId =
              getId(
                member?.user ||
                  member
              );

            if (memberId) {
              members.add(
                memberId
              );
            }
          }
        );
      });

      tasks.forEach((task) => {
        if (task.assignee) {
          members.add(
            task.assigneeName
          );
        }
      });

      if (
        user?._id &&
        !members.has(user._id)
      ) {
        members.add(user._id);
      }

      return members.size;
    }, [projects, tasks, user]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
                b.createdAt ||
                0
            ) -
            new Date(
              a.updatedAt ||
                a.createdAt ||
                0
            )
        )
        .slice(0, 4),
    [tasks]
  );

  const sprintStats = useMemo(() => {
    const sprintMap = {};

    tasks.forEach((task) => {
      const sprint =
        task.sprint ||
        "No Sprint";

      if (!sprintMap[sprint]) {
        sprintMap[sprint] = {
          name: sprint,
          total: 0,
          completed: 0,
          points: 0,
          completedPoints: 0,
        };
      }

      sprintMap[sprint].total += 1;

      sprintMap[sprint].points +=
        Number(
          task.storyPoints || 0
        );

      if (
        task.status === "Done"
      ) {
        sprintMap[sprint].completed +=
          1;

        sprintMap[sprint]
          .completedPoints +=
          Number(
            task.storyPoints || 0
          );
      }
    });

    const sprints =
      Object.values(sprintMap);

    if (!sprints.length) {
      return {
        name: "No active sprint",
        total: 0,
        completed: 0,
        points: 0,
        completedPoints: 0,
      };
    }

    return (
      sprints.find(
        (sprint) =>
          sprint.name !==
          "No Sprint"
      ) ||
      sprints[0]
    );
  }, [tasks]);

  const sprintCompletion =
    sprintStats.total > 0
      ? Math.round(
          (sprintStats.completed /
            sprintStats.total) *
            100
        )
      : 0;

  const currentUserName =
    getName(user) ||
    "Admin";

  const projectRows = useMemo(
    () =>
      activeProjects
        .slice(0, 4)
        .map((project) => {
          const projectTasks =
            tasks.filter(
              (task) =>
                task.projectId ===
                project.mongoId
            );

          const completed =
            projectTasks.filter(
              (task) =>
                task.status ===
                "Done"
            ).length;

          const total =
            projectTasks.length;

          return {
            project,
            taskText: `${completed} / ${total}`,
            status:
              getProjectStatus(
                project
              ),
          };
        }),
    [activeProjects, tasks]
  );

  const activityItems = useMemo(() => {
    const activities = [];

    tasks.forEach((task) => {
      task.activities.forEach(
        (activity) => {
          const activityUser =
            getName(
              activity.user
            ) ||
            task.assigneeName ||
            currentUserName;

          activities.push({
            id:
              activity._id ||
              `${task.mongoId}-${activity.createdAt}-${activity.message}`,

            task,

            activity,

            person:
              getInitials(
                activityUser
              ),

            name: activityUser,

            createdAt:
              activity.createdAt ||
              task.updatedAt ||
              task.createdAt,

            time:
              relativeTime(
                activity.createdAt ||
                  task.updatedAt
              ),
          });
        }
      );
    });

    return activities
      .sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      )
      .slice(0, 4);
  }, [tasks, currentUserName]);

  const fallbackActivities =
    useMemo(
      () =>
        recentTasks.map(
          (task) => ({
            id: task.mongoId,
            icon:
              task.status ===
              "Done"
                ? "check_circle"
                : task.status ===
                    "In Review"
                  ? "rate_review"
                  : "task_alt",

            type:
              task.status ===
              "Done"
                ? "success"
                : task.status ===
                    "In Review"
                  ? "primary"
                  : "secondary",

            title:
              task.status ===
              "Done"
                ? "Task completed"
                : "Task updated",

            description:
              `${task.key} • ${task.title}`,

            person:
              getInitials(
                task.assigneeName
              ),

            time:
              relativeTime(
                task.updatedAt ||
                  task.createdAt
              ),
          })
        ),
      [recentTasks]
    );

  const displayActivities =
    activityItems.length > 0
      ? activityItems.map(
          (item) => {
            const type =
              item.activity
                ?.type;

            let visualType =
              "primary";

            let icon =
              "update";

            if (
              type ===
              "comment"
            ) {
              visualType =
                "secondary";
              icon = "chat";
            } else if (
              type ===
              "status"
            ) {
              visualType =
                "success";
              icon =
                "check_circle";
            } else if (
              type ===
              "git"
            ) {
              visualType =
                "primary";
              icon = "commit";
            } else if (
              type ===
              "assignment"
            ) {
              visualType =
                "secondary";
              icon =
                "person_add";
            } else if (
              type ===
              "priority"
            ) {
              visualType =
                "warning";
              icon = "flag";
            }

            return {
              icon,
              type: visualType,
              title:
                item.activity
                  ?.message ||
                "Task activity",
              description:
                `${item.task.key} • ${item.task.title}`,
              person:
                item.person,
              time:
                item.time,
              taskId:
                item.task
                  .mongoId,
            };
          }
        )
      : fallbackActivities.map(
          (item) => ({
            ...item,
            taskId:
              item.id,
          })
        );

  const velocity =
    completedStoryPoints;

  const greeting =
    getGreeting();

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <span className="page-eyebrow">
            WORKSPACE OVERVIEW
          </span>

          <h1>
            {greeting},{" "}
            {currentUserName}
            <span className="heading-accent">
              .
            </span>
          </h1>

          <p>
            Here's what's happening
            across your engineering
            workspace today.
          </p>
        </div>

        <div className="dashboard-heading-actions">

          <button
            type="button"
            className="nova-primary-button"
            onClick={() =>
              navigate(
                "/projects"
              )
            }
          >
            <span className="material-symbols-outlined">
              add
            </span>

            New Project
          </button>
        </div>
      </section>

      {error && (
        <div className="dashboard-error">
          <span className="material-symbols-outlined">
            error
          </span>

          <div>
            <strong>
              Dashboard data
              unavailable
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={
              loadDashboard
            }
          >
            Retry
          </button>
        </div>
      )}

      <section className="dashboard-kpis">
        <div className="dashboard-kpi">
          <div className="kpi-top">
            <span className="kpi-label">
              ACTIVE PROJECTS
            </span>

            <span className="kpi-icon primary">
              <span className="material-symbols-outlined">
                folder_open
              </span>
            </span>
          </div>

          <div className="kpi-value">
            {loading
              ? "—"
              : activeProjects.length}
          </div>

          <div className="kpi-footer">
            <span className="kpi-positive">
              {projects.length}
            </span>

            <span>
              total projects
            </span>
          </div>
        </div>

        <div className="dashboard-kpi">
          <div className="kpi-top">
            <span className="kpi-label">
              OPEN TASKS
            </span>

            <span className="kpi-icon secondary">
              <span className="material-symbols-outlined">
                checklist
              </span>
            </span>
          </div>

          <div className="kpi-value">
            {loading
              ? "—"
              : openTasks.length}
          </div>

          <div className="kpi-footer">
            <span className="kpi-positive">
              {completionPercentage}%
            </span>

            <span>
              completed
            </span>
          </div>
        </div>

        <div className="dashboard-kpi">
          <div className="kpi-top">
            <span className="kpi-label">
              TEAM MEMBERS
            </span>

            <span className="kpi-icon tertiary">
              <span className="material-symbols-outlined">
                groups
              </span>
            </span>
          </div>

          <div className="kpi-value">
            {loading
              ? "—"
              : teamMemberCount}
          </div>

          <div className="kpi-footer">
            <span className="kpi-positive">
              {inProgressTasks.length}
            </span>

            <span>
              tasks in progress
            </span>
          </div>
        </div>

        <div className="dashboard-kpi">
          <div className="kpi-top">
            <span className="kpi-label">
              SPRINT VELOCITY
            </span>

            <span className="kpi-icon purple">
              <span className="material-symbols-outlined">
                speed
              </span>
            </span>
          </div>

          <div className="kpi-value">
            {loading
              ? "—"
              : velocity}

            <small>
              pts
            </small>
          </div>

          <div className="kpi-footer">
            <span className="kpi-positive">
              {completedStoryPoints}
            </span>

            <span>
              completed points
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel projects-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                DELIVERY
              </span>

              <h2>
                Active Projects
              </h2>
            </div>

            <button
              type="button"
              className="panel-link"
              onClick={() =>
                navigate(
                  "/projects"
                )
              }
            >
              View all

              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="project-list">
            {loading ? (
              <div className="dashboard-empty">
                <span className="material-symbols-outlined">
                  progress_activity
                </span>

                Loading projects...
              </div>
            ) : projectRows.length ===
              0 ? (
              <div className="dashboard-empty">
                <span className="material-symbols-outlined">
                  folder_off
                </span>

                No active projects
              </div>
            ) : (
              projectRows.map(
                ({
                  project,
                  taskText,
                  status,
                }) => (
                  <ProjectRow
                    key={
                      project.mongoId
                    }
                    project={
                      project
                    }
                    tasks={
                      taskText
                    }
                    status={
                      status.label
                    }
                    statusType={
                      status.type
                    }
                    onClick={() =>
                      navigate(
                        `/projects/${project.mongoId}`
                      )
                    }
                  />
                )
              )
            )}
          </div>
        </div>

        <div className="dashboard-panel activity-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                ACTIVITY
              </span>

              <h2>
                Recent Updates
              </h2>
            </div>

            <button
              type="button"
              className="panel-icon-button"
              aria-label="Refresh activity"
            >
              <span className="material-symbols-outlined">
                more_horiz
              </span>
            </button>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="dashboard-empty">
                <span className="material-symbols-outlined">
                  progress_activity
                </span>

                Loading activity...
              </div>
            ) : displayActivities.length ===
              0 ? (
              <div className="dashboard-empty">
                <span className="material-symbols-outlined">
                  history
                </span>

                No recent activity
              </div>
            ) : (
              displayActivities.map(
                (
                  activity,
                  index
                ) => (
                  <Activity
                    key={
                      activity.taskId ||
                      index
                    }
                    {...activity}
                    onClick={() => {
                      if (
                        activity.taskId
                      ) {
                        navigate(
                          `/tasks/${activity.taskId}`
                        );
                      }
                    }}
                  />
                )
              )
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-panel sprint-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              CURRENT SPRINT
            </span>

            <h2>
              {sprintStats.name}
              {" • "}
              Platform Improvements
            </h2>
          </div>

          <span className="sprint-status">
            {sprintStats.total > 0
              ? `${sprintStats.total - sprintStats.completed} tasks remaining`
              : "No sprint data"}
          </span>
        </div>

        <div className="sprint-content">
          <div className="sprint-progress-area">
            <div className="sprint-progress-header">
              <span>
                Sprint completion
              </span>

              <strong>
                {sprintCompletion}%
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-value"
                style={{
                  width: `${sprintCompletion}%`,
                }}
              />
            </div>
          </div>

          <div className="sprint-stat">
            <span>
              Completed
            </span>

            <strong>
              {
                sprintStats.completed
              }
            </strong>

            <small>
              tasks
            </small>
          </div>

          <div className="sprint-stat">
            <span>
              Remaining
            </span>

            <strong>
              {Math.max(
                0,
                sprintStats.total -
                  sprintStats.completed
              )}
            </strong>

            <small>
              tasks
            </small>
          </div>

          <div className="sprint-stat">
            <span>
              Velocity
            </span>

            <strong>
              {
                sprintStats.completedPoints
              }
            </strong>

            <small>
              points
            </small>
          </div>
        </div>
      </section>

      <section className="dashboard-status-strip">
        <div>
          <span className="dashboard-status-dot"></span>

          <span>
            NOVA workspace synchronized
          </span>
        </div>

        <span className="nova-code">
          {tasks.length} tasks •{" "}
          {projects.length} projects •{" "}
          {inReviewTasks.length} in review
        </span>
      </section>
    </div>
  );
}

function ProjectRow({
  project,
  tasks,
  status,
  statusType,
  onClick,
}) {
  return (
    <button
      type="button"
      className="project-row"
      onClick={onClick}
    >
      <div className="project-row-main">
        <div className="project-color-icon">
          <span className="material-symbols-outlined">
            folder
          </span>
        </div>

        <div className="project-row-info">
          <strong>
            {project.name}
          </strong>

          <span>
            {project.key}
          </span>
        </div>
      </div>

      <div className="project-progress">
        <div className="project-progress-top">
          <span>
            {project.progress}%
          </span>

          <span>
            {tasks}
          </span>
        </div>

        <div className="progress-track small">
          <div
            className="progress-value"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  project.progress
                )
              )}%`,
            }}
          />
        </div>
      </div>

      <span
        className={`status-badge status-${statusType}`}
      >
        {status}
      </span>
    </button>
  );
}

function Activity({
  icon,
  type,
  title,
  description,
  person,
  time,
  onClick,
}) {
  return (
    <button
      type="button"
      className="activity-item"
      onClick={onClick}
    >
      <div
        className={`activity-icon ${type}`}
      >
        <span className="material-symbols-outlined">
          {icon}
        </span>
      </div>

      <div className="activity-content">
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <div className="activity-meta">
        <div className="activity-avatar">
          {person}
        </div>

        <time>
          {time}
        </time>
      </div>
    </button>
  );
}

export default Dashboard;