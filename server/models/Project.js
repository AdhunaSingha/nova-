const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      trim: true,
      default: "Member",
    },
  },
  {
    _id: false,
  }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [120, "Project name cannot exceed 120 characters"],
    },

    key: {
      type: String,
      required: [true, "Project key is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Project key must be at least 2 characters"],
      maxlength: [12, "Project key cannot exceed 12 characters"],
      match: [
        /^[A-Z0-9-]+$/,
        "Project key can only contain letters, numbers and hyphens",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Engineering",
        "Product",
        "Design",
        "Infrastructure",
        "Research",
        "Other",
      ],
      default: "Engineering",
    },

    status: {
      type: String,
      enum: [
        "Planning",
        "Active",
        "On Hold",
        "Completed",
        "Archived",
      ],
      default: "Planning",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [projectMemberSchema],

    startDate: {
      type: Date,
      default: null,
    },

    deadline: {
      type: Date,
      default: null,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    budget: {
      type: Number,
      min: 0,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    techStack: {
      type: [String],
      default: [],
    },

    repository: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "#8083ff",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

projectSchema.index({
  name: "text",
  description: "text",
});

projectSchema.index({
  status: 1,
});

projectSchema.index({
  category: 1,
});

projectSchema.index({
  owner: 1,
});

projectSchema.index({
  createdBy: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Project = mongoose.model(
  "Project",
  projectSchema
);

module.exports = Project;