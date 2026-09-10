const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "comment",
        "status",
        "assignment",
        "priority",
        "label",
        "system",
        "git",
      ],
      default: "system",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const taskSchema = new mongoose.Schema(
  {
    /*
     * Basic Information
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Project
     */
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    /*
     * Workflow
     */
    status: {
      type: String,
      enum: [
        "Backlog",
        "To Do",
        "In Progress",
        "In Review",
        "Done",
      ],
      default: "Backlog",
      index: true,
    },

    priority: {
      type: String,
      enum: ["P0", "P1", "P2", "P3"],
      default: "P2",
      index: true,
    },

    /*
     * People
     */
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /*
     * Sprint
     */
    sprint: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * Estimation
     */
    storyPoints: {
      type: Number,
      min: 0,
      default: 0,
    },

    /*
     * Dates
     */
    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /*
     * Organization
     */
    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    /*
     * Task Breakdown
     */
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },

    /*
     * Technical Information
     */
    technicalSpecifications: {
      type: String,
      default: "",
      trim: true,
    },

    threatModel: {
      type: String,
      default: "",
      trim: true,
    },

    acceptanceCriteria: [
      {
        type: String,
        trim: true,
      },
    ],

    /*
     * Development / Repository
     */
    branch: {
      type: String,
      trim: true,
      default: "",
    },

    pullRequestUrl: {
      type: String,
      trim: true,
      default: "",
    },

    issueUrl: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * Environment & Observability
     */
    environment: {
      type: String,
      enum: [
        "Development",
        "Staging",
        "Production",
        "Not Set",
      ],
      default: "Not Set",
    },

    observability: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Dependencies
     */
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    /*
     * Time Tracking
     */
    timeLoggedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    estimatedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    /*
     * Discussion / Activity
     */
    activities: {
      type: [activitySchema],
      default: [],
    },

    /*
     * Task lifecycle
     */
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Useful indexes
 */
taskSchema.index({
  project: 1,
  status: 1,
});

taskSchema.index({
  project: 1,
  priority: 1,
});

taskSchema.index({
  assignee: 1,
  status: 1,
});

taskSchema.index({
  title: "text",
  description: "text",
});

/*
 * Automatically track completion date
 */
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "Done" && !this.completedAt) {
      this.completedAt = new Date();
    }

    if (this.status !== "Done") {
      this.completedAt = null;
    }
  }

  next();
});

module.exports = mongoose.model("Task", taskSchema);