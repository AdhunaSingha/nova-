import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import projectService from "../services/projectService";
import "../styles/project-details.css";

const statusConfig = {
  Planning: {
    label: "In Progress",
    className: "status-progress",
  },
  Active: {
    label: "On Track",
    className: "status-success",
  },
  "On Hold": {
    label: "At Risk",
    className: "status-warning",
  },
  Completed: {
    label: "Completed",
    className: "status-success",
  },
  Archived: {
    label: "Archived",
    className: "status-muted",
  },
};

const priorityConfig = {
  Low: {
    label: "Low",
    className: "priority-low",
  },
  Medium: {
    label: "Medium",
    className: "priority-medium",
  },
  High: {
    label: "High",
    className: "priority-high",
  },
  Critical: {
    label: "Critical",
    className: "priority-critical",
  },
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") {
    return "Not set";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [toast, setToast] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      setIsLoading(true);
      setError("");

      try {
        const response = await projectService.getProject(id);

        if (!isMounted) {
          return;
        }

        const projectData =
          response?.data?.project || response?.project;

        if (!projectData) {
          throw new Error(
            "Project data was not returned by the server."
          );
        }

        setProject(projectData);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load project.";

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const status = useMemo(() => {
    if (!project) {
      return {
        label: "Unknown",
        className: "status-muted",
      };
    }

    return (
      statusConfig[project.status] || {
        label: project.status || "Unknown",
        className: "status-muted",
      }
    );
  }, [project]);

  const priority = useMemo(() => {
    if (!project) {
      return {
        label: "Unknown",
        className: "priority-low",
      };
    }

    return (
      priorityConfig[project.priority] || {
        label: project.priority || "Unknown",
        className: "priority-low",
      }
    );
  }, [project]);

  const handleDelete = async () => {
    if (!project?._id) {
      return;
    }

    setIsDeleting(true);

    try {
      await projectService.deleteProject(project._id);

      setShowDeleteModal(false);
      setToast("Project archived successfully.");

      setTimeout(() => {
        navigate("/projects", {
          replace: true,
          state: {
            message: "Project archived successfully.",
          },
        });
      }, 700);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to archive project.";

      setToast(message);
      setIsDeleting(false);
    }
  };

  const handleCopyProjectId = async () => {
    if (!project) {
      return;
    }

    const projectId = project.key || project._id;

    try {
      await navigator.clipboard.writeText(projectId);
      setToast("Project ID copied.");
    } catch {
      setToast("Unable to copy project ID.");
    }
  };

  if (isLoading) {
    return (
      <main className="project-details-page">
        <div className="project-details-loading">
          <div className="project-details-spinner" />

          <p>Loading project...</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="project-details-page">
        <section className="project-details-error">
          <div className="error-icon">!</div>

          <h1>Project not found</h1>

          <p>
            {error ||
              "The project you are looking for does not exist or is no longer available."}
          </p>

          <button
            type="button"
            className="nova-button nova-button-primary"
            onClick={() => navigate("/projects")}
          >
            <span>Back to Projects</span>
          </button>
        </section>
      </main>
    );
  }

  const ownerName =
    project.owner?.name ||
    project.createdBy?.name ||
    "Unassigned";

  const ownerEmail =
    project.owner?.email ||
    project.createdBy?.email ||
    "";

  const members = Array.isArray(project.members)
    ? project.members
    : [];

  const techStack = Array.isArray(project.techStack)
    ? project.techStack
    : [];

  const tags = Array.isArray(project.tags)
    ? project.tags
    : [];

  const progress = Math.min(
    100,
    Math.max(0, Number(project.progress) || 0)
  );

  const projectKey = project.key || project._id;

  return (
    <main className="project-details-page">
      <div className="project-details-container">

        {/* Breadcrumb */}
        <nav
          className="project-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/dashboard">Workspace</Link>

          <span>/</span>

          <Link to="/projects">Projects</Link>

          <span>/</span>

          <span className="current">
            {projectKey}
          </span>
        </nav>

        {/* Header */}
        <header className="project-details-header">
          <div>
            <div className="project-details-kicker">

              <span className="project-key">
                {projectKey}
              </span>

              <button
                type="button"
                className="copy-button"
                onClick={handleCopyProjectId}
                title="Copy project ID"
              >
                ⧉
              </button>

              <span
                className={`status-pill ${status.className}`}
              >
                <span className="status-dot" />

                {status.label}
              </span>

              <span
                className={`priority-pill ${priority.className}`}
              >
                {priority.label}
              </span>
            </div>

            <h1>{project.name}</h1>

            <p>
              {project.description ||
                "No project description has been provided."}
            </p>
          </div>

          <div className="project-header-actions">

            <button
              type="button"
              className="nova-button nova-button-secondary"
              onClick={() => navigate("/projects")}
            >
              <span>←</span>
              Back
            </button>

            <button
              type="button"
              className="nova-button nova-button-secondary"
              onClick={() =>
                setToast(
                  "Project editing will be connected in the next step."
                )
              }
            >
              <span>✎</span>
              Edit
            </button>

            <button
              type="button"
              className="nova-button nova-button-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <span>⌫</span>
              Archive
            </button>

          </div>
        </header>

        {/* Main Content */}
        <div className="project-details-grid">

          {/* Main Column */}
          <section className="project-details-main">

            {/* Progress */}
            <article className="project-details-card">

              <div className="card-heading">
                <div>
                  <span className="card-eyebrow">
                    Overview
                  </span>

                  <h2>Project Progress</h2>
                </div>

                <strong className="progress-value">
                  {progress}%
                </strong>
              </div>

              <div className="large-progress">
                <div
                  className="large-progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="progress-meta">
                <span>
                  {progress >= 100
                    ? "Project completed"
                    : "Overall project completion"}
                </span>

                <span>
                  {progress}% complete
                </span>
              </div>

            </article>

            {/* Metrics */}
            <section className="project-metrics-grid">

              <article className="project-metric-card">

                <span className="metric-icon">
                  ◷
                </span>

                <div>
                  <span className="metric-label">
                    Start Date
                  </span>

                  <strong>
                    {formatDate(project.startDate)}
                  </strong>
                </div>

              </article>

              <article className="project-metric-card">

                <span className="metric-icon">
                  ◴
                </span>

                <div>
                  <span className="metric-label">
                    Deadline
                  </span>

                  <strong>
                    {formatDate(project.deadline)}
                  </strong>
                </div>

              </article>

              <article className="project-metric-card">

                <span className="metric-icon">
                  ◇
                </span>

                <div>
                  <span className="metric-label">
                    Budget
                  </span>

                  <strong>
                    {formatCurrency(project.budget)}
                  </strong>
                </div>

              </article>

              <article className="project-metric-card">

                <span className="metric-icon">
                  ◈
                </span>

                <div>
                  <span className="metric-label">
                    Team Size
                  </span>

                  <strong>
                    {members.length}
                  </strong>
                </div>

              </article>

            </section>

            {/* Project Information */}
            <article className="project-details-card">

              <div className="card-heading">
                <div>
                  <span className="card-eyebrow">
                    Project
                  </span>

                  <h2>
                    Project Information
                  </h2>
                </div>
              </div>

              <div className="project-information-grid">

                <div className="information-item">
                  <span>Project Key</span>

                  <strong>
                    {projectKey}
                  </strong>
                </div>

                <div className="information-item">
                  <span>Category</span>

                  <strong>
                    {project.category || "Not set"}
                  </strong>
                </div>

                <div className="information-item">
                  <span>Status</span>

                  <strong>
                    {project.status || "Not set"}
                  </strong>
                </div>

                <div className="information-item">
                  <span>Priority</span>

                  <strong>
                    {project.priority || "Not set"}
                  </strong>
                </div>

                <div className="information-item">
                  <span>Created</span>

                  <strong>
                    {formatDate(project.createdAt)}
                  </strong>
                </div>

                <div className="information-item">
                  <span>Last Updated</span>

                  <strong>
                    {formatDate(project.updatedAt)}
                  </strong>
                </div>

              </div>

            </article>

            {/* Project Team */}
            <article className="project-details-card">

              <div className="card-heading">

                <div>
                  <span className="card-eyebrow">
                    Collaboration
                  </span>

                  <h2>
                    Project Team
                  </h2>
                </div>

                <Link
                  to="/team"
                  className="card-link"
                >
                  View Team →
                </Link>

              </div>

              {members.length === 0 ? (
                <div className="empty-project-section">

                  <span>◎</span>

                  <p>
                    No team members have been assigned yet.
                  </p>

                </div>
              ) : (
                <div className="project-team-list">

                  {members.map((member, index) => {
                    const memberUser =
                      member.user || {};

                    const memberName =
                      memberUser.name ||
                      "Team Member";

                    return (
                      <div
                        className="project-team-member"
                        key={
                          memberUser._id ||
                          memberUser.id ||
                          index
                        }
                      >

                        <div className="team-member-avatar">
                          {getInitials(memberName)}
                        </div>

                        <div className="team-member-info">

                          <strong>
                            {memberName}
                          </strong>

                          <span>
                            {member.role || "Member"}
                          </span>

                        </div>

                        <span className="team-member-status">
                          Assigned
                        </span>

                      </div>
                    );
                  })}

                </div>
              )}

            </article>

            {/* Tech Stack */}
            <article className="project-details-card">

              <div className="card-heading">

                <div>
                  <span className="card-eyebrow">
                    Technology
                  </span>

                  <h2>
                    Tech Stack
                  </h2>
                </div>

              </div>

              {techStack.length === 0 ? (
                <div className="empty-project-section">

                  <span>⌘</span>

                  <p>
                    No technologies have been added yet.
                  </p>

                </div>
              ) : (
                <div className="tech-stack-list">

                  {techStack.map((technology) => (
                    <span
                      className="tech-stack-item"
                      key={technology}
                    >
                      {technology}
                    </span>
                  ))}

                </div>
              )}

            </article>

            {/* Tags */}
            <article className="project-details-card">

              <div className="card-heading">

                <div>
                  <span className="card-eyebrow">
                    Organization
                  </span>

                  <h2>
                    Tags
                  </h2>
                </div>

              </div>

              {tags.length === 0 ? (
                <div className="empty-project-section">

                  <span>#</span>

                  <p>
                    No tags have been added yet.
                  </p>

                </div>
              ) : (
                <div className="project-tags-list">

                  {tags.map((tag) => (
                    <span
                      className="project-tag"
                      key={tag}
                    >
                      #{tag}
                    </span>
                  ))}

                </div>
              )}

            </article>

            {/* Repository */}
            <article className="project-details-card repository-card">

              <div className="card-heading">

                <div>
                  <span className="card-eyebrow">
                    Development
                  </span>

                  <h2>
                    Repository
                  </h2>
                </div>

              </div>

              {project.repository ? (
                <a
                  href={project.repository}
                  target="_blank"
                  rel="noreferrer"
                  className="repository-link"
                >

                  <span className="repository-icon">
                    ⌘
                  </span>

                  <span>
                    <strong>
                      Open Repository
                    </strong>

                    <small>
                      {project.repository}
                    </small>
                  </span>

                  <span>
                    ↗
                  </span>

                </a>
              ) : (
                <div className="empty-project-section">

                  <span>⌘</span>

                  <p>
                    No repository has been connected.
                  </p>

                </div>
              )}

            </article>

          </section>

          {/* Sidebar */}
          <aside className="project-details-sidebar">

            {/* Project Lead */}
            <article className="project-sidebar-card">

              <span className="sidebar-card-label">
                Project Lead
              </span>

              <div className="project-owner">

                <div className="project-owner-avatar">
                  {getInitials(ownerName)}
                </div>

                <div>

                  <strong>
                    {ownerName}
                  </strong>

                  {ownerEmail && (
                    <span>
                      {ownerEmail}
                    </span>
                  )}

                </div>

              </div>

            </article>

            {/* Deadline */}
            <article className="project-sidebar-card deadline-card">

              <span className="sidebar-card-label">
                Deadline
              </span>

              <strong className="deadline-date">
                {formatDate(project.deadline)}
              </strong>

              <p>
                {project.deadline
                  ? "Project target completion date"
                  : "No deadline has been configured"}
              </p>

            </article>

            {/* Quick Actions */}
            <article className="project-sidebar-card">

              <span className="sidebar-card-label">
                Quick Actions
              </span>

              <div className="quick-actions">

                <button
                  type="button"
                  onClick={() => navigate("/tasks")}
                >
                  <span>✓</span>
                  View Tasks
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/team")}
                >
                  <span>♙</span>
                  View Team
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setToast(
                      "Project reporting will be connected in a later step."
                    )
                  }
                >
                  <span>▥</span>
                  Project Report
                </button>

              </div>

            </article>

            {/* Database ID */}
            <article className="project-sidebar-card project-id-card">

              <span className="sidebar-card-label">
                Database ID
              </span>

              <code>
                {project._id}
              </code>

            </article>

          </aside>

        </div>
      </div>

      {/* Archive Modal */}
      {showDeleteModal && (
        <div
          className="project-modal-backdrop"
          onMouseDown={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
            }
          }}
        >

          <div
            className="project-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-warning-icon">
              !
            </div>

            <h2>
              Archive Project?
            </h2>

            <p>
              Are you sure you want to archive{" "}
              <strong>
                {project.name}
              </strong>
              ? This will remove the project from the
              active workspace.
            </p>

            <div className="modal-actions">

              <button
                type="button"
                className="nova-button nova-button-secondary"
                disabled={isDeleting}
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="nova-button nova-button-danger"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting
                  ? "Archiving..."
                  : "Archive Project"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="project-toast"
          role="status"
          onClick={() => setToast("")}
        >
          <span>✓</span>

          {toast}
        </div>
      )}

    </main>
  );
}

export default ProjectDetails;