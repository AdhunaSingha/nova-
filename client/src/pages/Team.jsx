import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import teamService from "../services/teamService";

import "../styles/team.css";


/*
|--------------------------------------------------------------------------
| Department Labels
|--------------------------------------------------------------------------
*/

const departmentLabels = {
  ENG: "Engineering",
  DES: "Design",
  PROD: "Product",
  QA: "QA & Automation",
};


/*
|--------------------------------------------------------------------------
| Department Mapping
|--------------------------------------------------------------------------
*/

const departmentMap = {
  Engineering: "ENG",
  Design: "DES",
  Product: "PROD",
  "QA & Automation": "QA",
  Infrastructure: "ENG",
  Research: "ENG",
};


/*
|--------------------------------------------------------------------------
| Role Labels
|--------------------------------------------------------------------------
*/

const roleLabels = {
  admin: "Admin",
  "project-manager": "Project Manager",
  developer: "Developer",
  designer: "Designer",
  qa: "QA",
  member: "Member",
};


/*
|--------------------------------------------------------------------------
| Empty Member Form
|--------------------------------------------------------------------------
*/

const emptyMemberForm = {
  name: "",
  email: "",
  role: "developer",
  department: "Engineering",
  password: "",
  bio: "",
  timezone: "Asia/Kolkata",
};


/*
|--------------------------------------------------------------------------
| Normalize Member
|--------------------------------------------------------------------------
*/

const normalizeMember = (member) => {
  const name =
    member?.name ||
    "Unknown Member";


  const initials =
    member?.initials ||
    name
      .trim()
      .split(/\s+/)
      .map(
        (part) =>
          part[0] || ""
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  const rawRole =
    member?.role ||
    "member";


  const role =
    roleLabels[rawRole] ||
    rawRole
      .replace(/-/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );


  const department =
    member?.department ||
    "Engineering";


  const departmentCode =
    departmentMap[department] ||
    department;


  const activeTasks =
    Number(
      member?.activeTasks || 0
    );


  const completedTasks =
    Number(
      member?.completedTasks || 0
    );


  const workloadHours =
    Number(
      member?.workloadHours || 0
    );


  /*
  |--------------------------------------------------------------------------
  | CAPACITY
  |--------------------------------------------------------------------------
  |
  | Do NOT clamp the value to 100.
  |
  | 40h / 40h = 100%
  | 50h / 40h = 125%
  | 66h / 40h = 165%
  |
  */

  const capacity = Math.max(
    0,
    Number(
      member?.workloadPercentage ??
        member?.capacity ??
        0
    )
  );


  let status =
    member?.status ||
    "ACTIVE";


  status =
    status.toUpperCase();


  let statusLabel =
    member?.statusLabel ||
    "Active Now";


  if (status === "REVIEW") {
    statusLabel =
      "In Code Review";
  } else if (
    status === "AWAY"
  ) {
    statusLabel =
      "Away";
  } else if (
    status === "SPRINT"
  ) {
    statusLabel =
      "Sprint Focus";
  } else if (
    status === "ACTIVE"
  ) {
    statusLabel =
      "Active Now";
  }


  const accent =
    departmentCode === "DES"
      ? "primary"
      : departmentCode === "QA"
        ? "tertiary"
        : departmentCode === "PROD"
          ? "primary"
          : "secondary";


  const projects =
    Array.isArray(
      member?.projectNames
    )
      ? member.projectNames
      : Array.isArray(
          member?.projects
        )
        ? member.projects
        : [];


  const projectIds =
    Array.isArray(
      member?.projectIds
    )
      ? member.projectIds
      : [];


  return {
    ...member,

    id:
      member?.id ||
      member?._id,

    name,

    email:
      member?.email ||
      "No email available",

    role,

    position:
      member?.position ||
      role,

    department:
      departmentCode,

    projects,

    projectIds,

    activeTasks,

    completedTasks,

    overdueTasks:
      Number(
        member?.overdueTasks || 0
      ),

    reviewTasks:
      Number(
        member?.reviewTasks || 0
      ),

    capacity,

    workloadHours,

    hours:
      member?.hours ||
      `${workloadHours.toFixed(
        1
      )}h / ${
        member?.capacityHours ||
        40
      }h`,

    status,

    statusLabel,

    avatar: initials,

    initials,

    accent,

    capacityStatus:
      member?.capacityStatus ||
      (capacity > 100
        ? "OVERALLOCATED"
        : capacity >= 85
          ? "HIGH"
          : "HEALTHY"),
  };
};


/*
|--------------------------------------------------------------------------
| TEAM COMPONENT
|--------------------------------------------------------------------------
*/

function Team() {
  const navigate =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | Team State
  |--------------------------------------------------------------------------
  */

  const [members, setMembers] =
    useState([]);


  const [search, setSearch] =
    useState("");


  const [department, setDepartment] =
    useState("ALL");


  const [status, setStatus] =
    useState("ALL");


  const [view, setView] =
    useState("matrix");


  /*
  |--------------------------------------------------------------------------
  | Modal State
  |--------------------------------------------------------------------------
  */

  const [showModal, setShowModal] =
    useState(false);


  const [memberForm, setMemberForm] =
    useState(emptyMemberForm);


  const [submitting, setSubmitting] =
    useState(false);


  const [formError, setFormError] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | Activity State
  |--------------------------------------------------------------------------
  */

  const [selectedMember, setSelectedMember] =
    useState(null);


  /*
  |--------------------------------------------------------------------------
  | General State
  |--------------------------------------------------------------------------
  */

  const [toast, setToast] =
    useState("");


  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  const [error, setError] =
    useState("");


  const [teamTotals, setTeamTotals] =
    useState(null);


  /*
  |--------------------------------------------------------------------------
  | LOAD TEAM
  |--------------------------------------------------------------------------
  */

  const loadTeam = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await teamService.getTeam();


        const apiMembers =
          Array.isArray(
            response?.members
          )
            ? response.members
            : [];


        setMembers(
          apiMembers.map(
            normalizeMember
          )
        );


        setTeamTotals(
          response?.totals ||
            null
        );
      } catch (
        requestError
      ) {
        console.error(
          "Failed to load team:",
          requestError
        );


        setError(
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Unable to load team members."
        );


        setMembers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadTeam();
  }, [loadTeam]);


  /*
  |--------------------------------------------------------------------------
  | TOAST
  |--------------------------------------------------------------------------
  */

  const showToast =
    useCallback(
      (message) => {
        setToast(message);

        window.setTimeout(() => {
          setToast("");
        }, 2800);
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | FILTERING
  |--------------------------------------------------------------------------
  */

  const filteredMembers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();


      return members.filter(
        (member) => {
          const searchableText = [
            member.name,
            member.email,
            member.position,
            member.role,
            departmentLabels[
              member.department
            ] ||
              member.department,
            ...member.projects.map(
              (project) =>
                typeof project ===
                "string"
                  ? project
                  : project?.name ||
                    project?.key ||
                    ""
            ),
          ]
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );


          const matchesDepartment =
            department === "ALL" ||
            member.department ===
              department;


          const matchesStatus =
            status === "ALL" ||
            member.status ===
              status;


          return (
            matchesSearch &&
            matchesDepartment &&
            matchesStatus
          );
        }
      );
    }, [
      members,
      search,
      department,
      status,
    ]);


  /*
  |--------------------------------------------------------------------------
  | TEAM STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    if (teamTotals) {
      const totalMembers =
        Number(
          teamTotals.members
        ) ||
        members.length;


      const activeMembers =
        Number(
          teamTotals.active
        ) ||
        members.filter(
          (member) =>
            member.status ===
              "ACTIVE" ||
            member.status ===
              "REVIEW"
        ).length;


      const totalActiveTasks =
        Number(
          teamTotals.activeTasks
        ) ||
        members.reduce(
          (sum, member) =>
            sum +
            member.activeTasks,
          0
        );


      const avgCapacity =
        members.length > 0
          ? Math.round(
              members.reduce(
                (sum, member) =>
                  sum +
                  member.capacity,
                0
              ) /
                members.length
            )
          : 0;


      const overloaded =
        Number(
          teamTotals.overallocated
        ) ||
        members.filter(
          (member) =>
            member.capacity >
            100
        ).length;


      return {
        total: totalMembers,
        active: activeMembers,
        totalTasks:
          totalActiveTasks,
        avgCapacity,
        overloaded,
      };
    }


    const active =
      members.filter(
        (member) =>
          member.status ===
            "ACTIVE" ||
          member.status ===
            "REVIEW"
      ).length;


    const overloaded =
      members.filter(
        (member) =>
          member.capacity >
          100
      ).length;


    const totalTasks =
      members.reduce(
        (sum, member) =>
          sum +
          member.activeTasks,
        0
      );


    const avgCapacity =
      members.length > 0
        ? Math.round(
            members.reduce(
              (sum, member) =>
                sum +
                member.capacity,
              0
            ) /
              members.length
          )
        : 0;


    return {
      total: members.length,
      active,
      overloaded,
      totalTasks,
      avgCapacity,
    };
  }, [
    members,
    teamTotals,
  ]);


  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearch("");
    setDepartment("ALL");
    setStatus("ALL");
  };


  /*
  |--------------------------------------------------------------------------
  | OPEN ADD MEMBER MODAL
  |--------------------------------------------------------------------------
  */

  const openAddMemberModal =
    () => {
      setMemberForm(
        emptyMemberForm
      );

      setFormError("");

      setShowModal(true);
    };


  /*
  |--------------------------------------------------------------------------
  | CLOSE ADD MEMBER MODAL
  |--------------------------------------------------------------------------
  */

  const closeAddMemberModal =
    () => {
      if (submitting) {
        return;
      }

      setShowModal(false);

      setMemberForm(
        emptyMemberForm
      );

      setFormError("");
    };


  /*
  |--------------------------------------------------------------------------
  | HANDLE FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setMemberForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );


    if (formError) {
      setFormError("");
    }
  };


  /*
  |--------------------------------------------------------------------------
  | CREATE MEMBER
  |--------------------------------------------------------------------------
  */

  const handleAddMember =
    async (event) => {
      event.preventDefault();


      setFormError("");


      const name =
        memberForm.name.trim();


      const email =
        memberForm.email
          .trim()
          .toLowerCase();


      if (!name) {
        setFormError(
          "Please enter the member's name."
        );
        return;
      }


      if (!email) {
        setFormError(
          "Please enter the member's email."
        );
        return;
      }


      setSubmitting(true);


      try {
        const payload = {
          name,
          email,

          role:
            memberForm.role ||
            "member",

          department:
            memberForm.department ||
            "Engineering",

          timezone:
            memberForm.timezone ||
            "Asia/Kolkata",
        };


        /*
        |--------------------------------------------------------------------------
        | Optional Password
        |--------------------------------------------------------------------------
        */

        if (
          memberForm.password.trim()
        ) {
          payload.password =
            memberForm.password.trim();
        }


        /*
        |--------------------------------------------------------------------------
        | Optional Bio
        |--------------------------------------------------------------------------
        */

        if (
          memberForm.bio.trim()
        ) {
          payload.bio =
            memberForm.bio.trim();
        }


        /*
        |--------------------------------------------------------------------------
        | API CALL
        |--------------------------------------------------------------------------
        */

        const response =
          await teamService.createMember(
            payload
          );


        /*
        |--------------------------------------------------------------------------
        | Close Modal
        |--------------------------------------------------------------------------
        */

        setShowModal(false);

        setMemberForm(
          emptyMemberForm
        );

        setFormError("");


        /*
        |--------------------------------------------------------------------------
        | Refresh Team
        |--------------------------------------------------------------------------
        */

        await loadTeam();


        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        showToast(
          response?.message ||
            "Team member added successfully."
        );


        /*
        |--------------------------------------------------------------------------
        | Temporary Password
        |--------------------------------------------------------------------------
        */

        if (
          response?.temporaryPassword
        ) {
          window.alert(
            `Member created successfully.\n\nTemporary password:\n${response.temporaryPassword}\n\nPlease securely share this password with the new member.`
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Create member error:",
          requestError
        );


        setFormError(
          requestError?.response
            ?.data?.message ||
            requestError?.message ||
            "Failed to create team member."
        );
      } finally {
        setSubmitting(false);
      }
    };


  /*
  |--------------------------------------------------------------------------
  | REMOVE MEMBER
  |--------------------------------------------------------------------------
  |
  | Removal API is not implemented yet.
  |--------------------------------------------------------------------------
  */

  const handleRemove = (
    member
  ) => {
    showToast(
      `Remove ${member.name} will be enabled in the member management step.`
    );
  };


  /*
  |--------------------------------------------------------------------------
  | ASSIGN TASK
  |--------------------------------------------------------------------------
  */

  const handleAssign = (
    member
  ) => {
    showToast(
      `Opening Tasks to assign work to ${member.name}.`
    );


    window.setTimeout(() => {
      navigate("/tasks");
    }, 500);
  };


  /*
  |--------------------------------------------------------------------------
  | ACTIVITY
  |--------------------------------------------------------------------------
  */

  const handleActivity = (
    member
  ) => {
    setSelectedMember(member);
  };


  /*
  |--------------------------------------------------------------------------
  | CAPACITY HELPERS
  |--------------------------------------------------------------------------
  */

  const getCapacityClass =
    (capacity) => {
      if (capacity > 100) {
        return "danger";
      }

      if (capacity >= 80) {
        return "warning";
      }

      return "good";
    };


  const getCapacityLabel =
    (capacity) => {
      if (capacity > 100) {
        return `${capacity}% Overallocated`;
      }

      if (capacity >= 80) {
        return `${capacity}% High`;
      }

      return `${capacity}% Optimal`;
    };


  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="team-page">

        <section className="team-hero">

          <div>

            <div className="nova-label-sm team-eyebrow">
              NOVA / PEOPLE
            </div>


            <h1 className="nova-display team-title">
              Team Members
            </h1>


            <p className="nova-body-lg team-subtitle">
              Monitor team capacity,
              workload, activity, and
              delivery focus in one
              operational view.
            </p>

          </div>

        </section>


        <section className="team-loading nova-card">

          <div className="nova-loading-mark">
            N
          </div>


          <div>

            <strong>
              Loading team members
            </strong>


            <span>
              Building the current
              team roster from NOVA
              workspace data...
            </span>

          </div>

        </section>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="team-page">

        <section className="team-hero">

          <div>

            <div className="nova-label-sm team-eyebrow">
              NOVA / PEOPLE
            </div>


            <h1 className="nova-display team-title">
              Team Members
            </h1>


            <p className="nova-body-lg team-subtitle">
              Monitor team capacity,
              workload, activity, and
              delivery focus in one
              operational view.
            </p>

          </div>


          <button
            type="button"
            className="nova-button nova-button-primary team-add-button"
            onClick={() =>
              loadTeam(true)
            }
            disabled={refreshing}
          >
            <span className="material-symbols-outlined">
              refresh
            </span>


            {refreshing
              ? "Retrying..."
              : "Retry"}
          </button>

        </section>


        <section className="team-error nova-card">

          <span className="material-symbols-outlined">
            error
          </span>


          <div>

            <h3>
              Unable to load team
            </h3>


            <p>
              {error}
            </p>

          </div>

        </section>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="team-page">

      {/* ================================================================
          HERO
      ================================================================ */}

      <section className="team-hero">

        <div>

          <div className="nova-label-sm team-eyebrow">
            NOVA / PEOPLE
          </div>


          <h1 className="nova-display team-title">
            Team Members
          </h1>


          <p className="nova-body-lg team-subtitle">
            Monitor team capacity,
            workload, activity, and
            delivery focus in one
            operational view.
          </p>

        </div>


        <div className="team-hero-actions">

          <button
            type="button"
            className="team-refresh-button"
            onClick={() =>
              loadTeam(true)
            }
            disabled={refreshing}
          >

            <span className="material-symbols-outlined">
              refresh
            </span>


            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="nova-button nova-button-primary team-add-button"
            onClick={
              openAddMemberModal
            }
          >

            <span className="material-symbols-outlined">
              person_add
            </span>


            Add Member

          </button>

        </div>

      </section>


      {/* ================================================================
          KPI GRID
      ================================================================ */}

      <section className="team-kpi-grid">

        <div className="team-kpi-card">

          <div className="team-kpi-icon primary">

            <span className="material-symbols-outlined">
              groups
            </span>

          </div>


          <div>

            <span className="nova-label-sm team-kpi-label">
              Total Members
            </span>


            <strong className="team-kpi-value">
              {stats.total}
            </strong>

          </div>

        </div>


        <div className="team-kpi-card">

          <div className="team-kpi-icon tertiary">

            <span className="material-symbols-outlined">
              radio_button_checked
            </span>

          </div>


          <div>

            <span className="nova-label-sm team-kpi-label">
              Active Now
            </span>


            <strong className="team-kpi-value">
              {stats.active}
            </strong>

          </div>

        </div>


        <div className="team-kpi-card">

          <div className="team-kpi-icon secondary">

            <span className="material-symbols-outlined">
              task_alt
            </span>

          </div>


          <div>

            <span className="nova-label-sm team-kpi-label">
              Active Tasks
            </span>


            <strong className="team-kpi-value">
              {stats.totalTasks}
            </strong>

          </div>

        </div>


        <div className="team-kpi-card">

          <div className="team-kpi-icon warning">

            <span className="material-symbols-outlined">
              speed
            </span>

          </div>


          <div>

            <span className="nova-label-sm team-kpi-label">
              Avg Capacity
            </span>


            <strong className="team-kpi-value">
              {stats.avgCapacity}%
            </strong>

          </div>

        </div>


        <div className="team-kpi-card">

          <div className="team-kpi-icon error">

            <span className="material-symbols-outlined">
              warning
            </span>

          </div>


          <div>

            <span className="nova-label-sm team-kpi-label">
              Overallocated
            </span>


            <strong className="team-kpi-value">
              {stats.overloaded}
            </strong>

          </div>

        </div>

      </section>


      {/* ================================================================
          CONTROLS
      ================================================================ */}

      <section className="team-controls nova-card">

        <div className="team-controls-left">

          <div className="team-search">

            <span className="material-symbols-outlined">
              search
            </span>


            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search members..."
              aria-label="Search team members"
            />


            {search && (
              <button
                type="button"
                className="team-clear-search"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >

                <span className="material-symbols-outlined">
                  close
                </span>

              </button>
            )}

          </div>


          <select
            value={department}
            onChange={(event) =>
              setDepartment(
                event.target.value
              )
            }
            className="team-select"
            aria-label="Filter by department"
          >

            <option value="ALL">
              All Departments
            </option>


            <option value="ENG">
              Engineering
            </option>


            <option value="DES">
              Design
            </option>


            <option value="PROD">
              Product
            </option>


            <option value="QA">
              QA & Automation
            </option>

          </select>


          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="team-select"
            aria-label="Filter by status"
          >

            <option value="ALL">
              All Statuses
            </option>


            <option value="ACTIVE">
              Active Now
            </option>


            <option value="SPRINT">
              In Sprint / Focus
            </option>


            <option value="REVIEW">
              In Review
            </option>


            <option value="AWAY">
              Away
            </option>

          </select>

        </div>


        <div className="team-view-controls">

          <span className="nova-label-sm team-view-label">
            View:
          </span>


          <div className="team-view-switch">

            <button
              type="button"
              className={
                view === "matrix"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("matrix")
              }
            >

              <span className="material-symbols-outlined">
                table_rows
              </span>


              Matrix

            </button>


            <button
              type="button"
              className={
                view === "cards"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("cards")
              }
            >

              <span className="material-symbols-outlined">
                grid_view
              </span>


              Cards

            </button>

          </div>

        </div>

      </section>


      {/* ================================================================
          RESULTS BAR
      ================================================================ */}

      <div className="team-results-bar">

        <div>

          <span className="nova-label-sm">

            Showing{" "}

            <strong className="team-results-number">
              {filteredMembers.length}
            </strong>{" "}

            of{" "}
            {members.length}
            {" "}
            members

          </span>

        </div>


        {(search ||
          department !==
            "ALL" ||
          status !== "ALL") && (
          <button
            type="button"
            className="team-reset-button"
            onClick={
              resetFilters
            }
          >

            <span className="material-symbols-outlined">
              filter_alt_off
            </span>


            Clear filters

          </button>
        )}

      </div>


      {/* ================================================================
          MATRIX VIEW
      ================================================================ */}

      {view === "matrix" ? (

        <section className="team-table-wrapper nova-card">

          <div className="team-table-scroll">

            <table className="team-table">

              <thead>

                <tr>

                  <th>
                    Member & Role
                  </th>


                  <th>
                    Active Projects
                  </th>


                  <th>
                    Task Pipeline
                  </th>


                  <th className="capacity-column">
                    Capacity & Workload
                  </th>


                  <th>
                    Realtime Status
                  </th>


                  <th className="actions-column">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredMembers.map(
                  (member) => (

                    <tr
                      key={member.id}
                      className={
                        member.capacity >
                        100
                          ? "overloaded-row"
                          : ""
                      }
                    >

                      {/* MEMBER */}

                      <td>

                        <div className="member-identity">

                          <div className="member-avatar-wrap">

                            <div
                              className={`member-avatar ${member.accent}`}
                            >
                              {
                                member.avatar
                              }
                            </div>


                            <span
                              className={`member-online-dot ${member.status.toLowerCase()}`}
                            />

                          </div>


                          <div className="member-copy">

                            <div className="member-name-row">

                              <strong>
                                {
                                  member.name
                                }
                              </strong>


                              <span className="member-role">
                                {
                                  member.role
                                }
                              </span>

                            </div>


                            <div className="member-meta">

                              <span>
                                {
                                  member.email
                                }
                              </span>


                              <span>
                                •
                              </span>


                              <span
                                className={`member-position ${member.accent}`}
                              >
                                {
                                  member.position
                                }
                              </span>

                            </div>

                          </div>

                        </div>

                      </td>


                      {/* PROJECTS */}

                      <td>

                        <div className="project-tags">

                          {member.projects.length >
                          0 ? (

                            member.projects.map(
                              (
                                project,
                                index
                              ) => (

                                <span
                                  key={`${project?.id || project?._id || project?.key || project}-${index}`}
                                  className="project-tag"
                                >

                                  {typeof project ===
                                  "string"
                                    ? project
                                    : project?.name ||
                                      project?.key ||
                                      "Project"}

                                </span>

                              )
                            )

                          ) : (

                            <span className="empty-projects">
                              No active projects
                            </span>

                          )}

                        </div>

                      </td>


                      {/* TASK PIPELINE */}

                      <td>

                        <div className="task-pipeline">

                          <span className="task-pill active">

                            {
                              member.activeTasks
                            }{" "}
                            Active

                          </span>


                          {member.overdueTasks >
                          0 ? (

                            <span className="task-pill overdue">

                              {
                                member.overdueTasks
                              }{" "}
                              Overdue

                            </span>

                          ) : (

                            <span className="task-pill done">

                              {
                                member.completedTasks
                              }{" "}
                              Done

                            </span>

                          )}

                        </div>

                      </td>


                      {/* CAPACITY */}

                      <td>

                        <div className="capacity-cell">

                          <div className="capacity-header">

                            <span
                              className={
                                member.capacity >
                                100
                                  ? "capacity-danger"
                                  : member.capacity >=
                                      80
                                    ? "capacity-warning"
                                    : "capacity-good"
                              }
                            >
                              {
                                getCapacityLabel(
                                  member.capacity
                                )
                              }
                            </span>


                            <span>
                              {
                                member.hours
                              }
                            </span>

                          </div>


                          <div className="capacity-track">

                            <div
                              className={`capacity-fill ${getCapacityClass(
                                member.capacity
                              )}`}
                              style={{
                                width: `${Math.min(
                                  member.capacity,
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`member-status ${member.status.toLowerCase()}`}
                        >

                          <span />

                          {
                            member.statusLabel
                          }

                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="member-actions">

                          <button
                            type="button"
                            title="Assign Task"
                            onClick={() =>
                              handleAssign(
                                member
                              )
                            }
                          >

                            <span className="material-symbols-outlined">
                              add_task
                            </span>

                          </button>


                          <button
                            type="button"
                            title="View Activity Log"
                            onClick={() =>
                              handleActivity(
                                member
                              )
                            }
                          >

                            <span className="material-symbols-outlined">
                              history
                            </span>

                          </button>


                          <button
                            type="button"
                            title="Remove Member"
                            className="danger-action"
                            onClick={() =>
                              handleRemove(
                                member
                              )
                            }
                          >

                            <span className="material-symbols-outlined">
                              person_remove
                            </span>

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {filteredMembers.length ===
              0 && (

              <div className="team-empty">

                <span className="material-symbols-outlined">
                  group_off
                </span>


                <h3>
                  No team members found
                </h3>


                <p>
                  Try changing your
                  search or filters.
                </p>


                <button
                  type="button"
                  className="nova-button nova-button-secondary"
                  onClick={
                    resetFilters
                  }
                >
                  Reset Filters
                </button>

              </div>

            )}

          </div>

        </section>

      ) : (

        /* ================================================================
           CARDS VIEW
        ================================================================ */

        <section className="team-card-grid">

          {filteredMembers.map(
            (member) => (

              <article
                key={member.id}
                className="team-member-card nova-card"
              >

                <div className="member-card-header">

                  <div className="member-identity">

                    <div className="member-avatar-wrap">

                      <div
                        className={`member-avatar large ${member.accent}`}
                      >
                        {
                          member.avatar
                        }
                      </div>


                      <span
                        className={`member-online-dot ${member.status.toLowerCase()}`}
                      />

                    </div>

                  </div>


                  <span
                    className={`member-status ${member.status.toLowerCase()}`}
                  >

                    <span />

                    {
                      member.statusLabel
                    }

                  </span>

                </div>


                <div className="member-card-info">

                  <h3>
                    {
                      member.name
                    }
                  </h3>


                  <span className="member-role">
                    {
                      member.role
                    }
                  </span>


                  <p>
                    {
                      member.email
                    }
                  </p>


                  <span
                    className={`member-position ${member.accent}`}
                  >
                    {
                      member.position
                    }
                  </span>

                </div>


                <div className="member-card-projects">

                  <span className="nova-label-sm">
                    Projects
                  </span>


                  <div className="project-tags">

                    {member.projects
                      .length >
                    0 ? (

                      member.projects.map(
                        (
                          project,
                          index
                        ) => (

                          <span
                            key={`${project?.id || project?._id || project?.key || project}-${index}`}
                            className="project-tag"
                          >

                            {typeof project ===
                            "string"
                              ? project
                              : project?.name ||
                                project?.key ||
                                "Project"}

                          </span>

                        )
                      )

                    ) : (

                      <span className="empty-projects">
                        None assigned
                      </span>

                    )}

                  </div>

                </div>


                <div className="member-card-stats">

                  <div>

                    <span className="nova-label-sm">
                      Active
                    </span>


                    <strong>
                      {
                        member.activeTasks
                      }
                    </strong>

                  </div>


                  <div>

                    <span className="nova-label-sm">
                      Done
                    </span>


                    <strong>
                      {
                        member.completedTasks
                      }
                    </strong>

                  </div>


                  <div>

                    <span className="nova-label-sm">
                      Capacity
                    </span>


                    <strong>
                      {
                        member.capacity
                      }%
                    </strong>

                  </div>

                </div>


                <div className="capacity-cell card-capacity">

                  <div className="capacity-header">

                    <span
                      className={
                        member.capacity >
                        100
                          ? "capacity-danger"
                          : member.capacity >=
                              80
                            ? "capacity-warning"
                            : "capacity-good"
                      }
                    >
                      Workload
                    </span>


                    <span>
                      {
                        member.hours
                      }
                    </span>

                  </div>


                  <div className="capacity-track">

                    <div
                      className={`capacity-fill ${getCapacityClass(
                        member.capacity
                      )}`}
                      style={{
                        width: `${Math.min(
                          member.capacity,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                <div className="member-card-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleAssign(
                        member
                      )
                    }
                  >

                    <span className="material-symbols-outlined">
                      add_task
                    </span>

                    Assign

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      handleActivity(
                        member
                      )
                    }
                  >

                    <span className="material-symbols-outlined">
                      history
                    </span>

                    Activity

                  </button>


                  <button
                    type="button"
                    className="danger-action"
                    onClick={() =>
                      handleRemove(
                        member
                      )
                    }
                    title="Remove Member"
                  >

                    <span className="material-symbols-outlined">
                      person_remove
                    </span>

                  </button>

                </div>

              </article>

            )
          )}


          {filteredMembers.length ===
            0 && (

            <div className="team-empty card-empty">

              <span className="material-symbols-outlined">
                group_off
              </span>


              <h3>
                No team members found
              </h3>


              <p>
                Try changing your
                search or filters.
              </p>


              <button
                type="button"
                className="nova-button nova-button-secondary"
                onClick={
                  resetFilters
                }
              >
                Reset Filters
              </button>

            </div>

          )}

        </section>

      )}


      {/* ================================================================
          ADD MEMBER MODAL
      ================================================================ */}

      {showModal && (

        <div
          className="team-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddMemberModal();
            }
          }}
        >

          <div className="team-modal nova-card">

            <div className="team-modal-header">

              <div>

                <span className="nova-label-sm">
                  TEAM MANAGEMENT
                </span>


                <h2>
                  Add Team Member
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeAddMemberModal
                }
                disabled={submitting}
              >

                <span className="material-symbols-outlined">
                  close
                </span>

              </button>

            </div>


            <form
              onSubmit={
                handleAddMember
              }
            >

              {/* NAME */}

              <label>

                <span>
                  Name
                </span>


                <input
                  type="text"
                  name="name"
                  value={
                    memberForm.name
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="e.g. Alex Morgan"
                  autoFocus
                  autoComplete="name"
                  disabled={
                    submitting
                  }
                  required
                />

              </label>


              {/* EMAIL */}

              <label>

                <span>
                  Email
                </span>


                <input
                  type="email"
                  name="email"
                  value={
                    memberForm.email
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="alex@nova.io"
                  autoComplete="email"
                  disabled={
                    submitting
                  }
                  required
                />

              </label>


              {/* ROLE + DEPARTMENT */}

              <div className="team-form-grid">

                <label>

                  <span>
                    Role
                  </span>


                  <select
                    name="role"
                    value={
                      memberForm.role
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      submitting
                    }
                  >

                    <option value="member">
                      Member
                    </option>


                    <option value="developer">
                      Developer
                    </option>


                    <option value="designer">
                      Designer
                    </option>


                    <option value="qa">
                      QA
                    </option>


                    <option value="project-manager">
                      Project Manager
                    </option>


                    <option value="admin">
                      Admin
                    </option>

                  </select>

                </label>


                <label>

                  <span>
                    Department
                  </span>


                  <select
                    name="department"
                    value={
                      memberForm.department
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      submitting
                    }
                  >

                    <option value="Engineering">
                      Engineering
                    </option>


                    <option value="Design">
                      Design
                    </option>


                    <option value="Product">
                      Product
                    </option>


                    <option value="QA & Automation">
                      QA & Automation
                    </option>


                    <option value="Management">
                      Management
                    </option>

                  </select>

                </label>

              </div>


              {/* PASSWORD */}

              <label>

                <span>
                  Password
                  <small>
                    {" "}
                    Optional
                  </small>
                </span>


                <input
                  type="password"
                  name="password"
                  value={
                    memberForm.password
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Leave blank to generate one"
                  autoComplete="new-password"
                  disabled={
                    submitting
                  }
                />

              </label>


              {/* BIO */}

              <label>

                <span>
                  Bio
                  <small>
                    {" "}
                    Optional
                  </small>
                </span>


                <textarea
                  name="bio"
                  value={
                    memberForm.bio
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Short description about this member..."
                  rows="3"
                  maxLength="300"
                  disabled={
                    submitting
                  }
                />

              </label>


              {/* TIMEZONE */}

              <label>

                <span>
                  Timezone
                </span>


                <input
                  type="text"
                  name="timezone"
                  value={
                    memberForm.timezone
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Asia/Kolkata"
                  disabled={
                    submitting
                  }
                />

              </label>


              {/* FORM ERROR */}

              {formError && (

                <div className="team-form-error">

                  <span className="material-symbols-outlined">
                    error
                  </span>


                  <span>
                    {
                      formError
                    }
                  </span>

                </div>

              )}


              {/* INFORMATION */}

              <div className="team-modal-note">

                <span className="material-symbols-outlined">
                  info
                </span>


                <span>
                  The member will be
                  created in the NOVA
                  workspace and will
                  appear in the team
                  roster immediately.
                </span>

              </div>


              {/* ACTIONS */}

              <div className="team-modal-actions">

                <button
                  type="button"
                  className="nova-button nova-button-secondary"
                  onClick={
                    closeAddMemberModal
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="nova-button nova-button-primary"
                  disabled={
                    submitting
                  }
                >

                  <span className="material-symbols-outlined">
                    {submitting
                      ? "hourglass_top"
                      : "person_add"}
                  </span>


                  {submitting
                    ? "Creating..."
                    : "Create Member"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ================================================================
          ACTIVITY DRAWER
      ================================================================ */}

      {selectedMember && (

        <div
          className="team-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedMember(
                null
              );
            }
          }}
        >

          <div className="team-activity-drawer">

            <div className="team-modal-header">

              <div>

                <span className="nova-label-sm">
                  MEMBER OVERVIEW
                </span>


                <h2>
                  {
                    selectedMember.name
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedMember(
                    null
                  )
                }
              >

                <span className="material-symbols-outlined">
                  close
                </span>

              </button>

            </div>


            <div className="activity-profile">

              <div
                className={`member-avatar large ${selectedMember.accent}`}
              >
                {
                  selectedMember.avatar
                }
              </div>


              <div>

                <strong>
                  {
                    selectedMember.position
                  }
                </strong>


                <span>
                  {
                    departmentLabels[
                      selectedMember
                        .department
                    ] ||
                      selectedMember.department
                  }
                </span>

              </div>

            </div>


            <div className="activity-summary-grid">

              <div>

                <span className="nova-label-sm">
                  Active Tasks
                </span>


                <strong>
                  {
                    selectedMember.activeTasks
                  }
                </strong>

              </div>


              <div>

                <span className="nova-label-sm">
                  Completed
                </span>


                <strong>
                  {
                    selectedMember.completedTasks
                  }
                </strong>

              </div>


              <div>

                <span className="nova-label-sm">
                  Capacity
                </span>


                <strong>
                  {
                    selectedMember.capacity
                  }%
                </strong>

              </div>

            </div>


            <div className="activity-timeline">

              <div>

                <span className="timeline-dot tertiary" />


                <div>

                  <strong>
                    Current team workload
                  </strong>


                  <span>
                    {
                      selectedMember.hours
                    }
                  </span>

                </div>

              </div>


              <div>

                <span className="timeline-dot primary" />


                <div>

                  <strong>
                    Active project allocation
                  </strong>


                  <span>

                    {
                      selectedMember
                        .projects
                        .length
                    }{" "}

                    project
                    {
                      selectedMember
                        .projects
                        .length ===
                      1
                        ? ""
                        : "s"
                    }

                  </span>

                </div>

              </div>


              <div>

                <span className="timeline-dot secondary" />


                <div>

                  <strong>
                    Task pipeline
                  </strong>


                  <span>

                    {
                      selectedMember.activeTasks
                    }{" "}
                    active /{" "}
                    {
                      selectedMember
                        .completedTasks
                    }{" "}
                    completed

                  </span>

                </div>

              </div>


              <div>

                <span className="timeline-dot tertiary" />


                <div>

                  <strong>
                    Realtime status
                  </strong>


                  <span>
                    {
                      selectedMember.statusLabel
                    }
                  </span>

                </div>

              </div>

            </div>


            <button
              type="button"
              className="nova-button nova-button-secondary activity-close"
              onClick={() =>
                setSelectedMember(
                  null
                )
              }
            >
              Close Activity
            </button>

          </div>

        </div>

      )}


      {/* ================================================================
          TOAST
      ================================================================ */}

      {toast && (

        <div className="team-toast">

          <span className="material-symbols-outlined">
            check_circle
          </span>


          {toast}

        </div>

      )}

    </div>
  );
}


export default Team;