const mongoose = require("mongoose");
const dotenv = require("dotenv");

const connectDB = require("../config/db");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

dotenv.config();

/*
|--------------------------------------------------------------------------
| Seed Tasks
|--------------------------------------------------------------------------
*/

const seedTasks = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB.");
    console.log("Starting task seed...");
    console.log("----------------------------------------");

    /*
     * Find demo user
     */
    let demoUser = await User.findOne({
      email: "demo@nova.dev",
    });

    /*
     * Fallback to first user if demo user doesn't exist.
     */
    if (!demoUser) {
      demoUser = await User.findOne();
    }

    if (!demoUser) {
      throw new Error(
        "No users found. Please register a user before seeding tasks."
      );
    }

    console.log(`Using user: ${demoUser.name || demoUser.email}`);

    /*
     * Find projects
     */
    const projects = await Project.find({
      key: {
        $in: [
          "SPR-34",
          "INFRA-09",
          "MOB-21",
          "DATA-18",
          "NOVA-PLAT",
        ],
      },
    });

    if (projects.length === 0) {
      throw new Error(
        "No NOVA projects found. Run `npm run seed:projects` first."
      );
    }

    const projectMap = {};

    projects.forEach((project) => {
      projectMap[project.key] = project;
    });

    /*
     * Remove previous seeded tasks.
     */
    const taskKeys = [
      "NOVA-405",
      "NOVA-406",
      "NOVA-407",
      "NOVA-408",
      "NOVA-409",
      "NOVA-410",
      "NOVA-411",
      "NOVA-412",
      "NOVA-413",
      "NOVA-414",
      "NOVA-415",
      "NOVA-416",
    ];

    await Task.deleteMany({
      key: {
        $in: taskKeys,
      },
    });

    /*
     * Helper for project lookup.
     */
    const getProjectId = (key) => {
      const project = projectMap[key];

      if (!project) {
        console.warn(
          `Warning: Project ${key} was not found.`
        );

        return null;
      }

      return project._id;
    };

    /*
     * Task seed data
     */
    const tasks = [
      {
        title: "Implement JWT authentication middleware",
        key: "NOVA-405",
        description:
          "Create reusable authentication middleware for protecting NOVA API routes and validating JWT access tokens.",
        project: getProjectId("NOVA-PLAT"),
        status: "In Progress",
        priority: "P0",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 8,
        startDate: new Date("2026-09-05"),
        dueDate: new Date("2026-09-12"),
        labels: [
          "backend",
          "security",
          "authentication",
        ],
        technicalSpecifications:
          "Validate Bearer tokens using the configured JWT secret. Attach the authenticated user to req.user.",
        threatModel:
          "Invalid, expired, or forged access tokens must never grant access to protected resources.",
        acceptanceCriteria: [
          "Protected routes reject requests without a token.",
          "Invalid JWT tokens return HTTP 401.",
          "Expired tokens return HTTP 401.",
          "Valid tokens attach the authenticated user to req.user.",
        ],
        branch: "feature/jwt-auth-middleware",
        environment: "Development",
        observability:
          "Authentication failures should be logged without exposing token contents.",
        estimatedMinutes: 480,
        timeLoggedMinutes: 300,
        subtasks: [
          {
            title: "Create JWT verification helper",
            completed: true,
            completedAt: new Date("2026-09-06"),
          },
          {
            title: "Create authentication middleware",
            completed: true,
            completedAt: new Date("2026-09-07"),
          },
          {
            title: "Add protected route tests",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-405 was created.",
            user: demoUser._id,
          },
          {
            type: "status",
            message:
              "Task moved to In Progress.",
            user: demoUser._id,
          },
          {
            type: "git",
            message:
              "Authentication middleware branch created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Design project dashboard API",
        key: "NOVA-406",
        description:
          "Build API endpoints required by the NOVA dashboard for project metrics, sprint progress, and activity summaries.",
        project: getProjectId("SPR-34"),
        status: "To Do",
        priority: "P1",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 5,
        dueDate: new Date("2026-09-15"),
        labels: [
          "backend",
          "dashboard",
          "api",
        ],
        technicalSpecifications:
          "Return project counts, progress averages, active sprint information, and recent project activity.",
        acceptanceCriteria: [
          "Dashboard endpoint returns project metrics.",
          "Only authenticated users can access dashboard data.",
          "API response follows the standard NOVA response format.",
        ],
        branch: "feature/dashboard-api",
        environment: "Development",
        estimatedMinutes: 300,
        timeLoggedMinutes: 60,
        subtasks: [
          {
            title: "Define dashboard response schema",
            completed: true,
            completedAt: new Date("2026-09-08"),
          },
          {
            title: "Implement metrics query",
            completed: false,
          },
          {
            title: "Add API tests",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-406 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Refactor project service",
        key: "NOVA-407",
        description:
          "Refactor the frontend project service to provide consistent API methods and error handling.",
        project: getProjectId("NOVA-PLAT"),
        status: "In Review",
        priority: "P1",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 3,
        dueDate: new Date("2026-09-11"),
        labels: [
          "frontend",
          "refactor",
        ],
        technicalSpecifications:
          "Centralize Axios project requests inside projectService.js.",
        acceptanceCriteria: [
          "All project requests use projectService.",
          "Authentication headers are handled centrally.",
          "API errors are exposed consistently to components.",
        ],
        branch: "refactor/project-service",
        pullRequestUrl:
          "https://github.com/nova/example/pull/407",
        environment: "Development",
        estimatedMinutes: 180,
        timeLoggedMinutes: 150,
        subtasks: [
          {
            title: "Refactor GET requests",
            completed: true,
            completedAt: new Date("2026-09-08"),
          },
          {
            title: "Refactor mutation requests",
            completed: true,
            completedAt: new Date("2026-09-09"),
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-407 was created.",
            user: demoUser._id,
          },
          {
            type: "git",
            message:
              "Pull request opened for review.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Add MongoDB indexes for task queries",
        key: "NOVA-408",
        description:
          "Review task query patterns and add appropriate MongoDB indexes for Kanban and search performance.",
        project: getProjectId("INFRA-09"),
        status: "Done",
        priority: "P1",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 23",
        storyPoints: 3,
        startDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-05"),
        completedAt: new Date("2026-09-05"),
        labels: [
          "database",
          "performance",
          "mongodb",
        ],
        technicalSpecifications:
          "Index project/status, project/priority, assignee/status, and text-search fields.",
        acceptanceCriteria: [
          "Kanban queries use appropriate compound indexes.",
          "Search queries remain performant.",
          "No unnecessary duplicate indexes are introduced.",
        ],
        branch: "performance/task-indexes",
        environment: "Production",
        estimatedMinutes: 180,
        timeLoggedMinutes: 180,
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-408 was created.",
            user: demoUser._id,
          },
          {
            type: "status",
            message:
              "Task completed successfully.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Create responsive task board",
        key: "NOVA-409",
        description:
          "Implement responsive Kanban behavior for desktop, tablet, and mobile screen sizes.",
        project: getProjectId("NOVA-PLAT"),
        status: "In Progress",
        priority: "P1",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 5,
        startDate: new Date("2026-09-07"),
        dueDate: new Date("2026-09-14"),
        labels: [
          "frontend",
          "responsive",
          "kanban",
        ],
        acceptanceCriteria: [
          "Kanban columns remain usable on desktop.",
          "Task board can scroll horizontally on smaller screens.",
          "Task cards remain readable on mobile.",
        ],
        branch: "feature/responsive-task-board",
        environment: "Development",
        estimatedMinutes: 300,
        timeLoggedMinutes: 120,
        subtasks: [
          {
            title: "Desktop layout",
            completed: true,
            completedAt: new Date("2026-09-08"),
          },
          {
            title: "Tablet layout",
            completed: false,
          },
          {
            title: "Mobile layout",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-409 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Implement task search and filters",
        key: "NOVA-410",
        description:
          "Add server-side task search and filtering by project, status, priority, sprint, and assignee.",
        project: getProjectId("SPR-34"),
        status: "To Do",
        priority: "P2",
        assignee: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 5,
        dueDate: new Date("2026-09-17"),
        labels: [
          "backend",
          "search",
          "filters",
        ],
        acceptanceCriteria: [
          "Users can search by task title.",
          "Users can search by task key.",
          "Tasks can be filtered by status.",
          "Tasks can be filtered by priority.",
          "Tasks can be filtered by project.",
        ],
        environment: "Development",
        estimatedMinutes: 300,
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-410 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Build task activity stream",
        key: "NOVA-411",
        description:
          "Implement activity and discussion functionality for task details.",
        project: getProjectId("NOVA-PLAT"),
        status: "Backlog",
        priority: "P2",
        assignee: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 25",
        storyPoints: 5,
        dueDate: new Date("2026-09-22"),
        labels: [
          "frontend",
          "backend",
          "comments",
        ],
        acceptanceCriteria: [
          "Users can add comments.",
          "Status changes appear in the activity stream.",
          "Git-related activities can be displayed.",
          "Activity entries include timestamps.",
        ],
        environment: "Development",
        estimatedMinutes: 300,
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-411 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Secure environment configuration",
        key: "NOVA-412",
        description:
          "Review environment variables and remove sensitive configuration from source code.",
        project: getProjectId("INFRA-09"),
        status: "In Review",
        priority: "P0",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 3,
        dueDate: new Date("2026-09-10"),
        labels: [
          "security",
          "devops",
          "configuration",
        ],
        technicalSpecifications:
          "All secrets must be loaded from environment variables and must never be committed to Git.",
        threatModel:
          "Prevent accidental exposure of database credentials, JWT secrets, and third-party API keys.",
        acceptanceCriteria: [
          "Secrets are stored outside source code.",
          ".env is excluded from Git.",
          "Production configuration uses environment variables.",
        ],
        branch: "security/environment-config",
        pullRequestUrl:
          "https://github.com/nova/example/pull/412",
        environment: "Staging",
        estimatedMinutes: 180,
        timeLoggedMinutes: 160,
        subtasks: [
          {
            title: "Audit environment variables",
            completed: true,
            completedAt: new Date("2026-09-08"),
          },
          {
            title: "Update deployment configuration",
            completed: true,
            completedAt: new Date("2026-09-09"),
          },
          {
            title: "Security review",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-412 was created.",
            user: demoUser._id,
          },
          {
            type: "git",
            message:
              "Pull request submitted for security review.",
            user: demoUser._id,
          },
          {
            type: "comment",
            message:
              "Environment configuration is ready for final review.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Create project member assignment UI",
        key: "NOVA-413",
        description:
          "Create the interface for assigning users to projects and managing project roles.",
        project: getProjectId("MOB-21"),
        status: "Backlog",
        priority: "P2",
        assignee: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 25",
        storyPoints: 5,
        dueDate: new Date("2026-09-24"),
        labels: [
          "frontend",
          "team",
          "projects",
        ],
        acceptanceCriteria: [
          "Project members can be displayed.",
          "Members can be assigned to projects.",
          "Project roles can be selected.",
          "Users can be removed from projects.",
        ],
        environment: "Development",
        estimatedMinutes: 300,
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-413 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Add project progress analytics",
        key: "NOVA-414",
        description:
          "Calculate project progress using task completion and display useful project analytics.",
        project: getProjectId("DATA-18"),
        status: "In Progress",
        priority: "P1",
        assignee: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 8,
        dueDate: new Date("2026-09-18"),
        labels: [
          "analytics",
          "backend",
          "projects",
        ],
        acceptanceCriteria: [
          "Project task completion percentage is calculated.",
          "Completed and remaining tasks are counted.",
          "Progress can be consumed by the frontend.",
        ],
        environment: "Development",
        estimatedMinutes: 480,
        timeLoggedMinutes: 180,
        subtasks: [
          {
            title: "Create aggregation query",
            completed: true,
            completedAt: new Date("2026-09-08"),
          },
          {
            title: "Calculate completion percentage",
            completed: false,
          },
          {
            title: "Expose analytics endpoint",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-414 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Integrate GitHub pull request status",
        key: "NOVA-415",
        description:
          "Connect task details with pull request information so developers can see development progress.",
        project: getProjectId("NOVA-PLAT"),
        status: "Backlog",
        priority: "P2",
        assignee: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 25",
        storyPoints: 8,
        dueDate: new Date("2026-09-25"),
        labels: [
          "github",
          "integration",
          "devops",
        ],
        acceptanceCriteria: [
          "Task can store a pull request URL.",
          "Pull request information can be displayed.",
          "Git activity can appear in the task activity stream.",
        ],
        branch: "feature/github-integration",
        environment: "Development",
        estimatedMinutes: 480,
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-415 was created.",
            user: demoUser._id,
          },
        ],
      },

      {
        title: "Complete NOVA task details interface",
        key: "NOVA-416",
        description:
          "Finish the Task Details page with properties, acceptance criteria, subtasks, activity stream, dependencies, and observability information.",
        project: getProjectId("SPR-34"),
        status: "To Do",
        priority: "P1",
        assignee: demoUser._id,
        reviewer: demoUser._id,
        createdBy: demoUser._id,
        sprint: "Sprint 24",
        storyPoints: 8,
        dueDate: new Date("2026-09-20"),
        labels: [
          "frontend",
          "task-details",
          "ui",
        ],
        technicalSpecifications:
          "Task Details should consume the Task API and expose editable task properties without duplicating business logic in the frontend.",
        acceptanceCriteria: [
          "Task information is loaded from the API.",
          "Task status can be changed.",
          "Task properties can be updated.",
          "Subtasks can be managed.",
          "Comments can be submitted.",
          "Task activity is displayed.",
        ],
        environment: "Development",
        estimatedMinutes: 480,
        timeLoggedMinutes: 120,
        subtasks: [
          {
            title: "Connect task API",
            completed: false,
          },
          {
            title: "Connect properties",
            completed: false,
          },
          {
            title: "Connect activity stream",
            completed: false,
          },
        ],
        activities: [
          {
            type: "system",
            message:
              "Task NOVA-416 was created.",
            user: demoUser._id,
          },
        ],
      },
    ];

    /*
     * Remove tasks that don't have a valid project.
     */
    const validTasks = tasks.filter((task) => {
      if (!task.project) {
        console.warn(
          `Skipping ${task.key}: project was not found.`
        );

        return false;
      }

      return true;
    });

    /*
     * Insert tasks.
     */
    const insertedTasks = await Task.insertMany(
      validTasks
    );

    console.log(
      `Inserted ${insertedTasks.length} tasks.`
    );

    console.log("----------------------------------------");
    console.log("Task seed completed successfully.");
    console.log("----------------------------------------");

    /*
     * Display a simple summary.
     */
    const summary = await Task.aggregate([
      {
        $match: {
          key: {
            $in: taskKeys,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    console.log("Task status summary:");

    summary.forEach((item) => {
      console.log(
        `  ${item._id}: ${item.count}`
      );
    });

    console.log("----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("----------------------------------------");
    console.error("Task seed failed.");
    console.error("----------------------------------------");
    console.error(error);

    process.exit(1);
  }
};

seedTasks();