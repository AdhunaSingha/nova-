const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("../config/db");

const User = require("../models/User");
const Project = require("../models/Project");

const seedProjects = async () => {
  try {
    console.log("Starting NOVA project seed...");

    /*
    |--------------------------------------------------------------------------
    | Connect MongoDB
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find a user to own the projects
    |--------------------------------------------------------------------------
    */

    let user = await User.findOne({
      email: "demo@nova.dev",
    });

    /*
    |--------------------------------------------------------------------------
    | If demo user doesn't exist, find any user
    |--------------------------------------------------------------------------
    */

    if (!user) {
      user = await User.findOne();
    }

    /*
    |--------------------------------------------------------------------------
    | No users available
    |--------------------------------------------------------------------------
    */

    if (!user) {
      console.error(
        "No users found in MongoDB."
      );

      console.error(
        "Please register a user before running the project seed."
      );

      process.exit(1);
    }

    console.log(
      `Using user: ${user.name} (${user.email})`
    );

    /*
    |--------------------------------------------------------------------------
    | Remove existing seeded projects
    |--------------------------------------------------------------------------
    */

    await Project.deleteMany({
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

    /*
    |--------------------------------------------------------------------------
    | Project data
    |--------------------------------------------------------------------------
    */

    const projects = [
      {
        name: "Sprint Planning Revamp",
        key: "SPR-34",
        description:
          "Improve sprint planning, workload visibility and delivery forecasting across engineering teams.",
        category: "Product",
        status: "Active",
        priority: "High",

        owner: user._id,
        createdBy: user._id,

        startDate: new Date("2026-08-10"),
        deadline: new Date("2026-09-30"),

        progress: 72,

        budget: 45000,

        tags: [
          "Sprint",
          "Planning",
          "Productivity",
        ],

        techStack: [
          "React",
          "Node.js",
          "MongoDB",
        ],

        repository:
          "https://github.com/nova/sprint-planning",

        color: "#8083ff",
      },

      {
        name: "Infrastructure Migration",
        key: "INFRA-09",
        description:
          "Migrate core services to a scalable infrastructure platform with improved observability and reliability.",
        category: "Infrastructure",
        status: "Active",
        priority: "Critical",

        owner: user._id,
        createdBy: user._id,

        startDate: new Date("2026-07-15"),
        deadline: new Date("2026-10-15"),

        progress: 58,

        budget: 125000,

        tags: [
          "Infrastructure",
          "Cloud",
          "DevOps",
        ],

        techStack: [
          "Node.js",
          "Docker",
          "AWS",
        ],

        repository:
          "https://github.com/nova/infrastructure",

        color: "#00a2e6",
      },

      {
        name: "Mobile Experience",
        key: "MOB-21",
        description:
          "Redesign the mobile experience with a faster navigation system and improved task management workflows.",
        category: "Design",
        status: "Active",
        priority: "High",

        owner: user._id,
        createdBy: user._id,

        startDate: new Date("2026-08-01"),
        deadline: new Date("2026-10-05"),

        progress: 43,

        budget: 68000,

        tags: [
          "Mobile",
          "UX",
          "Design",
        ],

        techStack: [
          "React Native",
          "TypeScript",
          "Figma",
        ],

        repository:
          "https://github.com/nova/mobile-experience",

        color: "#4edea3",
      },

      {
        name: "Analytics Platform",
        key: "DATA-18",
        description:
          "Build an internal analytics platform for engineering velocity, delivery health and operational insights.",
        category: "Research",
        status: "Planning",
        priority: "Medium",

        owner: user._id,
        createdBy: user._id,

        startDate: new Date("2026-09-15"),
        deadline: new Date("2026-12-20"),

        progress: 18,

        budget: 95000,

        tags: [
          "Analytics",
          "Data",
          "Insights",
        ],

        techStack: [
          "React",
          "Express",
          "MongoDB",
          "Python",
        ],

        repository:
          "https://github.com/nova/analytics",

        color: "#c0c1ff",
      },

      {
        name: "NOVA Platform",
        key: "NOVA-PLAT",
        description:
          "Core team productivity platform for project planning, task orchestration and team visibility.",
        category: "Engineering",
        status: "Active",
        priority: "Critical",

        owner: user._id,
        createdBy: user._id,

        startDate: new Date("2026-06-01"),
        deadline: new Date("2026-11-30"),

        progress: 64,

        budget: 150000,

        tags: [
          "NOVA",
          "Platform",
          "Engineering",
        ],

        techStack: [
          "React",
          "Node.js",
          "Express",
          "MongoDB",
        ],

        repository:
          "https://github.com/nova/platform",

        color: "#8083ff",
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | Insert projects
    |--------------------------------------------------------------------------
    */

    const createdProjects =
      await Project.insertMany(projects);

    console.log(
      `Successfully created ${createdProjects.length} projects.`
    );

    /*
    |--------------------------------------------------------------------------
    | Display projects
    |--------------------------------------------------------------------------
    */

    createdProjects.forEach((project) => {
      console.log(
        `✓ ${project.key} — ${project.name}`
      );
    });

    console.log(
      "NOVA project seed completed successfully."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Project seed failed:"
    );

    console.error(error);

    process.exit(1);
  }
};

seedProjects();