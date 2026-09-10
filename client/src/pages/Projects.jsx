import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import projectService from "../services/projectService";

import "../styles/projects.css";

/*
|--------------------------------------------------------------------------
| Frontend category configuration
|--------------------------------------------------------------------------
*/

const categoryFilters = [
  {
    id: "all",
    label: "All Projects",
  },
  {
    id: "frontend",
    label: "Frontend / Client",
  },
  {
    id: "backend",
    label: "Backend & APIs",
  },
  {
    id: "devops",
    label: "DevOps & Cloud",
  },
  {
    id: "archived",
    label: "Archived",
  },
];

/*
|--------------------------------------------------------------------------
| Backend → Frontend category mapping
|--------------------------------------------------------------------------
*/

const backendToFrontendCategory = {
  Engineering: "backend",
  Product: "frontend",
  Design: "frontend",
  Infrastructure: "devops",
  Research: "backend",
  Other: "backend",
};

/*
|--------------------------------------------------------------------------
| Frontend → Backend category mapping
|--------------------------------------------------------------------------
*/

const frontendToBackendCategory = {
  frontend: "Product",
  backend: "Engineering",
  devops: "Infrastructure",
  archived: "Other",
};

/*
|--------------------------------------------------------------------------
| Normalize API project
|--------------------------------------------------------------------------
|
| Converts MongoDB project data into the shape expected by
| the existing NOVA Projects UI.
|
*/

function normalizeProject(project) {
  const frontendCategory =
    backendToFrontendCategory[project.category] ||
    "backend";

  const ownerName =
    project.owner?.name ||
    project.createdBy?.name ||
    "Workspace Admin";

  const ownerInitials = getInitials(ownerName);

  const memberAvatars =
    Array.isArray(project.members) &&
    project.members.length > 0
      ? project.members
          .slice(0, 4)
          .map((member) =>
            getInitials(
              member.user?.name || "Member"
            )
          )
      : [ownerInitials];

  const completedTasks =
    Number(project.completedTasks) || 0;

  const totalTasks =
    Number(project.totalTasks) || 0;

  const progress =
    Number(project.progress) || 0;

  const deadline =
    project.deadline
      ? formatDateInput(project.deadline)
      : "";

  return {
    ...project,

    /*
    |--------------------------------------------------------------------------
    | Keep MongoDB ID separately
    |--------------------------------------------------------------------------
    */

    mongoId: project._id,

    /*
    |--------------------------------------------------------------------------
    | UI project code
    |--------------------------------------------------------------------------
    */

    id: project.key,

    /*
    |--------------------------------------------------------------------------
    | UI category
    |--------------------------------------------------------------------------
    */

    category: frontendCategory,

    backendCategory: project.category,

    /*
    |--------------------------------------------------------------------------
    | Status mapping
    |--------------------------------------------------------------------------
    */

    status: normalizeStatus(project.status),

    /*
    |--------------------------------------------------------------------------
    | Existing UI fields
    |--------------------------------------------------------------------------
    */

    technologies:
      Array.isArray(project.techStack)
        ? project.techStack
        : [],

    completedTasks,

    totalTasks,

    progress,

    lead: ownerName,

    deadline,

    deadlineLabel: formatDate(
      project.deadline
    ),

    avatars: memberAvatars,

    extraMembers: Math.max(
      0,
      (project.members?.length || 0) -
        memberAvatars.length
    ),
  };
}

/*
|--------------------------------------------------------------------------
| Normalize backend status for existing UI
|--------------------------------------------------------------------------
*/

function normalizeStatus(status) {
  if (status === "Active") {
    return "On Track";
  }

  if (status === "On Hold") {
    return "At Risk";
  }

  if (status === "Completed") {
    return "Completed";
  }

  if (status === "Archived") {
    return "Completed";
  }

  if (status === "Planning") {
    return "In Progress";
  }

  return status || "In Progress";
}

/*
|--------------------------------------------------------------------------
| Main Projects Page
|--------------------------------------------------------------------------
*/

function Projects() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [projects, setProjects] = useState([]);

  const [category, setCategory] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("updated");

  const [view, setView] =
    useState("grid");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [toast, setToast] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load projects
  |--------------------------------------------------------------------------
  */

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setApiError("");

      const response =
        await projectService.getProjects();

      if (!response.success) {
        throw new Error(
          response.message ||
            "Unable to load projects."
        );
      }

      const normalizedProjects =
        (response.projects || []).map(
          normalizeProject
        );

      setProjects(normalizedProjects);
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );

      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load projects."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial API request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadProjects();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Toast cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  /*
  |--------------------------------------------------------------------------
  | Category counts
  |--------------------------------------------------------------------------
  */

  const categoryCounts = useMemo(() => {
    const activeProjects =
      projects.filter(
        (project) =>
          project.backendCategory !==
          "Archived" &&
          project.status !== "Completed"
      );

    return {
      all: projects.length,

      frontend: projects.filter(
        (project) =>
          project.category === "frontend"
      ).length,

      backend: projects.filter(
        (project) =>
          project.category === "backend"
      ).length,

      devops: projects.filter(
        (project) =>
          project.category === "devops"
      ).length,

      archived: projects.filter(
        (project) =>
          project.backendCategory ===
            "Other" &&
          project.status === "Completed"
      ).length,

      inFlight: activeProjects.length,

      atRisk: projects.filter(
        (project) =>
          project.status === "At Risk"
      ).length,

      completed: projects.filter(
        (project) =>
          project.status === "Completed"
      ).length,
    };
  }, [projects]);

  /*
  |--------------------------------------------------------------------------
  | Filter + Search + Sort
  |--------------------------------------------------------------------------
  */

  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const result = projects.filter(
      (project) => {
        const matchesCategory =
          category === "all" ||
          project.category === category ||
          (
            category === "archived" &&
            project.backendCategory ===
              "Other" &&
            project.status ===
              "Completed"
          );

        const searchableText = [
          project.name,
          project.description,
          project.lead,
          project.id,
          project.backendCategory,
          ...project.technologies,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        return (
          matchesCategory &&
          matchesSearch
        );
      }
    );

    return [...result].sort(
      (a, b) => {
        if (sortBy === "progress") {
          return (
            b.progress - a.progress
          );
        }

        if (sortBy === "deadline") {
          if (!a.deadline) {
            return 1;
          }

          if (!b.deadline) {
            return -1;
          }

          return (
            new Date(a.deadline) -
            new Date(b.deadline)
          );
        }

        return a.name.localeCompare(
          b.name
        );
      }
    );
  }, [
    projects,
    category,
    search,
    sortBy,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Create Project
  |--------------------------------------------------------------------------
  */

  const handleCreateProject =
    async (projectData) => {
      try {
        setIsSubmitting(true);
        setApiError("");

        const backendCategory =
          frontendToBackendCategory[
            projectData.category
          ] || "Engineering";

        const response =
          await projectService.createProject(
            {
              name:
                projectData.name.trim(),

              key:
                projectData.key?.trim()
                  ? projectData.key
                      .trim()
                      .toUpperCase()
                  : generateProjectKey(
                      projectData.name
                    ),

              description:
                "New engineering initiative created from the NOVA workspace.",

              category:
                backendCategory,

              status: "Planning",

              priority: "Medium",

              deadline:
                projectData.deadline ||
                null,

              progress: 0,

              techStack:
                projectData.technologies ||
                [],
            }
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              "Unable to create project."
          );
        }

        const normalizedProject =
          normalizeProject(
            response.project
          );

        setProjects(
          (current) => [
            normalizedProject,
            ...current,
          ]
        );

        setModalOpen(false);

        setCategory("all");

        setSearch("");

        setToast({
          type: "success",
          message:
            "Project created successfully.",
        });
      } catch (error) {
        console.error(
          "Create project failed:",
          error
        );

        setToast({
          type: "error",
          message:
            error.response?.data
              ?.message ||
            error.message ||
            "Unable to create project.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */

  const exportProjects = () => {
    const headers = [
      "Project",
      "Code",
      "Category",
      "Status",
      "Progress",
      "Lead",
      "Deadline",
    ];

    const rows =
      filteredProjects.map(
        (project) => [
          project.name,
          project.id,
          project.backendCategory,
          project.status,
          `${project.progress}%`,
          project.lead,
          project.deadline,
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value || "").replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "nova-projects.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
  |--------------------------------------------------------------------------
  | Navigate to project
  |--------------------------------------------------------------------------
  */

  const openProject = (project) => {
    /*
    |--------------------------------------------------------------------------
    | Use MongoDB _id for API-compatible ProjectDetails routing.
    |--------------------------------------------------------------------------
    */

    navigate(
      `/projects/${project.mongoId}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="projects-page">
      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <section className="projects-heading">
        <div className="projects-title-area">
          <div className="projects-breadcrumb">
            <span>PORTFOLIO</span>
            <span>/</span>
            <span>
              ENGINEERING INITIATIVES
            </span>
          </div>

          <h1>Projects Directory</h1>

          <p>
            Manage, track and deliver
            cross-functional team
            initiatives with real-time
            health telemetry, sprint
            velocities, and dependency
            tracking.
          </p>
        </div>

        <div className="projects-header-actions">
          <StatPill
            dot="primary"
            label="Total:"
            value={categoryCounts.all}
          />

          <StatPill
            dot="secondary"
            label="In Flight:"
            value={categoryCounts.inFlight}
            valueClass="secondary"
          />

          <StatPill
            dot="error"
            label="At Risk:"
            value={categoryCounts.atRisk}
            valueClass="error"
          />

          <StatPill
            dot="tertiary"
            label="Completed:"
            value={categoryCounts.completed}
            valueClass="tertiary"
          />

          <div className="project-action-group">
            <button
              type="button"
              className="project-secondary-button"
              onClick={
                exportProjects
              }
              disabled={
                projects.length === 0
              }
            >
              <span className="material-symbols-outlined">
                file_download
              </span>

              Export
            </button>

            <button
              type="button"
              className="project-primary-button"
              onClick={() =>
                setModalOpen(true)
              }
            >
              <span className="material-symbols-outlined">
                add_circle
              </span>

              New Project
            </button>
          </div>
        </div>
      </section>

      {/* ========================================
          VELOCITY BANNER
      ======================================== */}

      <section className="velocity-banner">
        <div className="velocity-main">
          <div className="velocity-icon">
            <span className="material-symbols-outlined">
              speed
            </span>
          </div>

          <div className="velocity-copy">
            <div className="velocity-title-row">
              <h2>
                Sprint Portfolio
                Velocity
              </h2>

              <span className="velocity-badge">
                +18.4% vs Q3
              </span>
            </div>

            <p>
              Portfolio delivery
              telemetry from your NOVA
              workspace.
            </p>
          </div>
        </div>

        <div className="velocity-metric">
          <div>
            <span>
              THROUGHPUT
            </span>

            <strong>
              84.2 pts/wk
            </strong>
          </div>

          <svg
            className="velocity-chart"
            viewBox="0 0 144 40"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 32 L20 28 L40 34 L60 18 L80 22 L100 8 L120 14 L144 2"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />

            <path
              d="M0 32 L20 28 L40 34 L60 18 L80 22 L100 8 L120 14 L144 2 L144 40 L0 40 Z"
              fill="currentColor"
              fillOpacity="0.12"
            />

            <circle
              cx="144"
              cy="2"
              r="3"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ========================================
          FILTER BAR
      ======================================== */}

      <section className="projects-toolbar">
        <div className="category-tabs">
          {categoryFilters.map(
            (filter) => (
              <button
                key={filter.id}
                type="button"
                className={`category-pill ${
                  category ===
                  filter.id
                    ? "category-pill-active"
                    : ""
                }`}
                onClick={() =>
                  setCategory(
                    filter.id
                  )
                }
              >
                {filter.label}

                {" ("}

                {filter.id === "all"
                  ? categoryCounts.all
                  : categoryCounts[
                      filter.id
                    ] || 0}

                {")"}
              </button>
            )
          )}
        </div>

        <div className="project-tools">
          <div className="project-search">
            <span className="material-symbols-outlined">
              search
            </span>

            <input
              type="text"
              placeholder="Search by name, tech stack, or lead..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="sort-wrapper">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >
              <option value="updated">
                Last Updated
              </option>

              <option value="deadline">
                Deadline
              </option>

              <option value="progress">
                Progress %
              </option>
            </select>

            <span className="material-symbols-outlined">
              expand_more
            </span>
          </div>

          <div className="view-switcher">
            <button
              type="button"
              className={
                view === "grid"
                  ? "view-button view-button-active"
                  : "view-button"
              }
              onClick={() =>
                setView("grid")
              }
              title="Grid View"
            >
              <span className="material-symbols-outlined">
                grid_view
              </span>
            </button>

            <button
              type="button"
              className={
                view === "list"
                  ? "view-button view-button-active"
                  : "view-button"
              }
              onClick={() =>
                setView("list")
              }
              title="List View"
            >
              <span className="material-symbols-outlined">
                format_list_bulleted
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================
          LOADING
      ======================================== */}

      {isLoading && (
        <section className="projects-state">
          <div className="projects-spinner" />

          <h3>
            Loading projects...
          </h3>

          <p>
            Connecting to your NOVA
            workspace.
          </p>
        </section>
      )}

      {/* ========================================
          API ERROR
      ======================================== */}

      {!isLoading &&
        apiError && (
          <section className="projects-state projects-state-error">
            <div className="projects-state-icon">
              !
            </div>

            <h3>
              Unable to load
              projects
            </h3>

            <p>{apiError}</p>

            <button
              type="button"
              className="nova-button nova-button-primary"
              onClick={
                loadProjects
              }
            >
              Try again
            </button>
          </section>
        )}

      {/* ========================================
          PROJECTS
      ======================================== */}

      {!isLoading &&
        !apiError && (
          <section
            className={
              view === "grid"
                ? "projects-container projects-grid"
                : "projects-container projects-list"
            }
          >
            {filteredProjects.map(
              (project) => (
                <ProjectCard
                  key={
                    project.mongoId ||
                    project.id
                  }
                  project={project}
                  view={view}
                  onOpen={() =>
                    openProject(
                      project
                    )
                  }
                />
              )
            )}

            {/* Quick create */}

            <button
              type="button"
              className="quick-create-card"
              onClick={() =>
                setModalOpen(true)
              }
            >
              <div className="quick-create-icon">
                <span className="material-symbols-outlined">
                  add
                </span>
              </div>

              <strong>
                Add New Initiative
              </strong>

              <p>
                Provision workspace
                sprint board, assign
                team leads, and
                configure CI/CD
                repository
                integrations.
              </p>

              <div className="quick-create-shortcut">
                <span>
                  Shortcut:
                </span>

                <kbd>⌘N</kbd>
              </div>
            </button>

            {filteredProjects.length ===
              0 && (
              <div className="projects-empty">
                <span className="material-symbols-outlined">
                  search_off
                </span>

                <h3>
                  No projects found
                </h3>

                <p>
                  Try changing your
                  search or category
                  filter.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory(
                      "all"
                    );
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}

      {/* ========================================
          CREATE PROJECT MODAL
      ======================================== */}

      {modalOpen && (
        <CreateProjectModal
          onClose={() =>
            !isSubmitting &&
            setModalOpen(false)
          }
          onCreate={
            handleCreateProject
          }
          isSubmitting={
            isSubmitting
          }
        />
      )}

      {/* ========================================
          TOAST
      ======================================== */}

      {toast && (
        <div
          className={`projects-toast projects-toast-${toast.type}`}
        >
          <span className="material-symbols-outlined">
            {toast.type ===
            "success"
              ? "check_circle"
              : "error"}
          </span>

          <span>
            {toast.message}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast(null)
            }
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stat Pill
|--------------------------------------------------------------------------
*/

function StatPill({
  dot,
  label,
  value,
  valueClass = "",
}) {
  return (
    <div className="project-stat-pill">
      <span
        className={`stat-dot ${dot}`}
      />

      <span>{label}</span>

      <strong
        className={valueClass}
      >
        {value}
      </strong>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Project Card
|--------------------------------------------------------------------------
*/

function ProjectCard({
  project,
  view,
  onOpen,
}) {
  const statusClass =
    getStatusClass(
      project.status
    );

  const progressClass =
    getProgressClass(
      project.status
    );

  if (view === "list") {
    return (
      <article
        className="project-card project-card-list"
        onClick={onOpen}
      >
        <div className="project-card-list-main">
          <div className="project-status-row">
            <StatusBadge
              status={
                project.status
              }
            />

            <span className="project-code">
              {project.id}
            </span>
          </div>

          <button
            type="button"
            className="project-card-title"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {project.name}

            <span className="material-symbols-outlined">
              arrow_outward
            </span>
          </button>

          <p>
            {project.description}
          </p>
        </div>

        <div className="project-list-stack">
          {project.technologies.map(
            (technology) => (
              <span
                key={technology}
                className="tech-tag"
              >
                {technology}
              </span>
            )
          )}
        </div>

        <div className="project-list-progress">
          <div className="project-progress-header">
            <span>
              {project.completedTasks}/
              {project.totalTasks}{" "}
              Tasks
            </span>

            <strong
              className={
                progressClass
              }
            >
              {project.progress}%
            </strong>
          </div>

          <ProgressBar
            progress={
              project.progress
            }
            status={
              project.status
            }
          />
        </div>

        <div className="project-list-deadline">
          <span className="material-symbols-outlined">
            event
          </span>

          {project.deadlineLabel}
        </div>
      </article>
    );
  }

  return (
    <article
      className="project-card"
      onClick={onOpen}
    >
      <div className="project-card-content">
        <div className="project-card-top">
          <div className="project-status-row">
            <StatusBadge
              status={
                project.status
              }
            />

            <span className="project-code">
              {project.id}
            </span>
          </div>

          <button
            type="button"
            className="project-menu-button"
            onClick={(event) =>
              event.stopPropagation()
            }
            aria-label={`Options for ${project.name}`}
          >
            <span className="material-symbols-outlined">
              more_horiz
            </span>
          </button>
        </div>

        <div className="project-identity">
          <button
            type="button"
            className="project-card-title"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {project.name}

            <span className="material-symbols-outlined">
              arrow_outward
            </span>
          </button>

          <p>
            {project.description}
          </p>
        </div>

        <div className="project-tech-stack">
          {project.technologies.map(
            (technology) => (
              <span
                key={technology}
                className="tech-tag"
              >
                {technology}
              </span>
            )
          )}
        </div>

        <div className="project-progress">
          <div className="project-progress-header">
            <span>
              Progress (
              {project.completedTasks}/
              {project.totalTasks}{" "}
              Tasks)
            </span>

            <strong
              className={
                progressClass
              }
            >
              {project.progress}%
            </strong>
          </div>

          <ProgressBar
            progress={
              project.progress
            }
            status={
              project.status
            }
          />
        </div>
      </div>

      <div className="project-card-footer">
        <div className="project-lead">
          <div className="project-avatars">
            {project.avatars.map(
              (avatar) => (
                <span
                  key={avatar}
                  className="project-avatar"
                >
                  {avatar}
                </span>
              )
            )}

            {project.extraMembers >
              0 && (
              <span className="project-avatar extra">
                +
                {
                  project.extraMembers
                }
              </span>
            )}
          </div>

          <span>
            {project.lead}
          </span>
        </div>

        <div
          className={`project-deadline ${
            statusClass ===
            "danger"
              ? "project-deadline-danger"
              : ""
          }`}
        >
          <span className="material-symbols-outlined">
            {statusClass ===
            "danger"
              ? "alarm"
              : "event"}
          </span>

          {project.deadlineLabel}
        </div>
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}) {
  const statusClass =
    getStatusClass(status);

  const icon =
    status === "Completed"
      ? "check_circle"
      : status === "At Risk"
      ? "warning"
      : "";

  return (
    <span
      className={`project-status-badge ${statusClass}`}
    >
      {icon && (
        <span className="material-symbols-outlined">
          {icon}
        </span>
      )}

      {!icon && (
        <span className="status-indicator" />
      )}

      {status}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Progress Bar
|--------------------------------------------------------------------------
*/

function ProgressBar({
  progress,
  status,
}) {
  return (
    <div className="project-progress-track">
      <div
        className={`project-progress-value ${getProgressClass(
          status
        )}`}
        style={{
          width: `${Math.min(
            Math.max(
              Number(progress) || 0,
              0
            ),
            100
          )}%`,
        }}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Create Project Modal
|--------------------------------------------------------------------------
*/

function CreateProjectModal({
  onClose,
  onCreate,
  isSubmitting,
}) {
  const [name, setName] =
    useState("");

  const [category, setCategory] =
    useState("frontend");

  const [deadline, setDeadline] =
    useState("");

  const [technologies, setTechnologies] =
    useState("");

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!name.trim()) {
      return;
    }

    onCreate({
      name: name.trim(),

      category,

      deadline,

      technologies:
        technologies
          .split(",")
          .map(
            (technology) =>
              technology.trim()
          )
          .filter(Boolean),
    });
  };

  return (
    <div
      className="project-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="project-modal">
        <div className="project-modal-header">
          <div className="project-modal-title">
            <div className="project-modal-icon">
              <span className="material-symbols-outlined">
                rocket_launch
              </span>
            </div>

            <div>
              <h2>
                Initiate New
                Project
              </h2>

              <p>
                Spin up a tracked
                engineering
                deliverable.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={
              isSubmitting
            }
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <form
          className="project-form"
          onSubmit={
            handleSubmit
          }
        >
          <div className="project-form-field">
            <label htmlFor="project-name">
              Project Name
            </label>

            <input
              id="project-name"
              type="text"
              placeholder="e.g., Vector Search Microservice"
              value={name}
              onChange={(event) =>
                setName(
                  event.target
                    .value
                )
              }
              required
              disabled={
                isSubmitting
              }
            />
          </div>

          <div className="project-form-grid">
            <div className="project-form-field">
              <label htmlFor="project-domain">
                Cluster Domain
              </label>

              <select
                id="project-domain"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value
                  )
                }
                disabled={
                  isSubmitting
                }
              >
                <option value="frontend">
                  Frontend / Client
                </option>

                <option value="backend">
                  Backend & APIs
                </option>

                <option value="devops">
                  DevOps & Cloud
                </option>

                <option value="archived">
                  Data & ML
                </option>
              </select>
            </div>

            <div className="project-form-field">
              <label htmlFor="project-deadline">
                Target Deadline
              </label>

              <input
                id="project-deadline"
                type="date"
                value={deadline}
                onChange={(event) =>
                  setDeadline(
                    event.target
                      .value
                  )
                }
                required
                disabled={
                  isSubmitting
                }
              />
            </div>
          </div>

          <div className="project-form-field">
            <label htmlFor="project-stack">
              Primary Tech Stack
              (Comma separated)
            </label>

            <input
              id="project-stack"
              type="text"
              placeholder="e.g., Go, Kafka, Redis, gRPC"
              value={
                technologies
              }
              onChange={(event) =>
                setTechnologies(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
            />
          </div>

          <div className="project-modal-actions">
            <button
              type="button"
              className="modal-cancel-button"
              onClick={onClose}
              disabled={
                isSubmitting
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-create-button"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <span className="auth-spinner" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getStatusClass(
  status
) {
  if (status === "On Track") {
    return "success";
  }

  if (
    status === "At Risk"
  ) {
    return "danger";
  }

  if (
    status === "Completed"
  ) {
    return "completed";
  }

  return "progress";
}

function getProgressClass(
  status
) {
  if (status === "On Track") {
    return "success";
  }

  if (
    status === "At Risk"
  ) {
    return "danger";
  }

  if (
    status === "Completed"
  ) {
    return "completed";
  }

  return "primary";
}

function formatDate(
  date
) {
  if (!date) {
    return "No deadline";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "No deadline";
  }

  return value.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );
}

function formatDateInput(
  date
) {
  if (!date) {
    return "";
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return "";
  }

  const year =
    value.getFullYear();

  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitials(
  name
) {
  if (!name) {
    return "NA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ||
        ""
    )
    .join("");
}

function generateProjectKey(
  name
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  let key = words
    .slice(0, 3)
    .map(
      (word) =>
        word
          .replace(
            /[^a-zA-Z0-9]/g,
            ""
          )
          .slice(0, 4)
          .toUpperCase()
    )
    .join("-");

  if (!key) {
    key = "NOVA";
  }

  return `${key}-${Date.now()
    .toString()
    .slice(-4)}`;
}

export default Projects;