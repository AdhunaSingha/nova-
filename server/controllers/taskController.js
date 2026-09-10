const mongoose = require("mongoose");

const Task = require("../models/Task");
const Project = require("../models/Project");

const STATUS_VALUES = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];

const PRIORITY_VALUES = ["P0", "P1", "P2", "P3"];

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getUserId(req) {
  return req.user?._id || req.user?.id;
}

function getErrorMessage(error, fallback) {
  if (error?.code === 11000) {
    return "A task with this key already exists.";
  }

  return error?.message || fallback;
}

/*
|--------------------------------------------------------------------------
| Generate Task Key
|--------------------------------------------------------------------------
|
| Example:
| NOVA-405
| NOVA-406
| NOVA-407
|
| If the project has a key, we use it as the prefix.
|--------------------------------------------------------------------------
*/

async function generateTaskKey(projectKey) {
  const prefix = String(projectKey || "NOVA")
    .trim()
    .toUpperCase();

  const latestTask = await Task.findOne({
    key: new RegExp(`^${prefix}-\\d+$`, "i"),
  })
    .sort({ createdAt: -1 })
    .select("key")
    .lean();

  let nextNumber = 1;

  if (latestTask?.key) {
    const match = latestTask.key.match(/-(\d+)$/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `${prefix}-${nextNumber}`;
}

/*
|--------------------------------------------------------------------------
| Populate Options
|--------------------------------------------------------------------------
*/

const populateTask = (query) =>
  query
    .populate("project", "name key status category")
    .populate("assignee", "name email role avatar")
    .populate("reviewer", "name email role avatar")
    .populate("createdBy", "name email role avatar")
    .populate("dependencies", "title key status priority");

/*
|--------------------------------------------------------------------------
| GET /api/tasks
|--------------------------------------------------------------------------
|
| Get all tasks.
|
| Supported query parameters:
|
| project
| status
| priority
| assignee
| sprint
| search
| archived
| sort
|--------------------------------------------------------------------------
*/

const getTasks = async (req, res) => {
  try {
    const {
      project,
      status,
      priority,
      assignee,
      sprint,
      search,
      archived = "false",
      sort = "-updatedAt",
    } = req.query;

    const filter = {
      isArchived: archived === "true",
    };

    /*
     * Project filter
     */
    if (project) {
      if (!isValidObjectId(project)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      filter.project = project;
    }

    /*
     * Status filter
     */
    if (status) {
      if (!STATUS_VALUES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }

      filter.status = status;
    }

    /*
     * Priority filter
     */
    if (priority) {
      if (!PRIORITY_VALUES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }

      filter.priority = priority;
    }

    /*
     * Assignee filter
     */
    if (assignee) {
      if (!isValidObjectId(assignee)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee ID.",
        });
      }

      filter.assignee = assignee;
    }

    /*
     * Sprint filter
     */
    if (sprint) {
      filter.sprint = sprint;
    }

    /*
     * Search
     */
    if (search?.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        {
          title: searchRegex,
        },
        {
          description: searchRegex,
        },
        {
          key: searchRegex,
        },
        {
          labels: searchRegex,
        },
      ];
    }

    const tasks = await populateTask(
      Task.find(filter).sort(sort)
    ).lean();

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tasks.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/tasks/:id
|--------------------------------------------------------------------------
|
| Get one task by MongoDB ID.
|--------------------------------------------------------------------------
*/

const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await populateTask(
      Task.findOne({
        _id: id,
        isArchived: false,
      })
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| POST /api/tasks
|--------------------------------------------------------------------------
|
| Create a new task.
|--------------------------------------------------------------------------
*/

const createTask = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      title,
      key,
      description,
      project,
      status,
      priority,
      assignee,
      reviewer,
      sprint,
      storyPoints,
      startDate,
      dueDate,
      labels,
      subtasks,
      technicalSpecifications,
      threatModel,
      acceptanceCriteria,
      branch,
      pullRequestUrl,
      issueUrl,
      environment,
      observability,
      dependencies,
      estimatedMinutes,
    } = req.body;

    /*
     * Required fields
     */
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project is required.",
      });
    }

    if (!isValidObjectId(project)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    /*
     * Verify project
     */
    const projectData = await Project.findById(project);

    if (!projectData) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    /*
     * Validate status
     */
    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    /*
     * Validate priority
     */
    if (priority && !PRIORITY_VALUES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority.",
      });
    }

    /*
     * Generate key when one isn't supplied.
     */
    let taskKey = key?.trim().toUpperCase();

    if (!taskKey) {
      taskKey = await generateTaskKey(projectData.key);
    }

    /*
     * Prevent duplicate key.
     */
    const existingTask = await Task.findOne({
      key: taskKey,
    });

    if (existingTask) {
      return res.status(409).json({
        success: false,
        message: `Task key ${taskKey} already exists.`,
      });
    }

    /*
     * Create task
     */
    const task = await Task.create({
      title: title.trim(),
      key: taskKey,
      description: description || "",
      project,
      status: status || "Backlog",
      priority: priority || "P2",
      assignee: assignee || null,
      reviewer: reviewer || null,
      createdBy: userId,
      sprint: sprint || "",
      storyPoints: Number(storyPoints) || 0,
      startDate: startDate || null,
      dueDate: dueDate || null,
      labels: Array.isArray(labels) ? labels : [],
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      technicalSpecifications:
        technicalSpecifications || "",
      threatModel: threatModel || "",
      acceptanceCriteria: Array.isArray(acceptanceCriteria)
        ? acceptanceCriteria
        : [],
      branch: branch || "",
      pullRequestUrl: pullRequestUrl || "",
      issueUrl: issueUrl || "",
      environment: environment || "Not Set",
      observability: observability || "",
      dependencies: Array.isArray(dependencies)
        ? dependencies
        : [],
      estimatedMinutes: Number(estimatedMinutes) || 0,

      activities: [
        {
          type: "system",
          message: `Task ${taskKey} was created.`,
          user: userId,
        },
      ],
    });

    /*
     * Return populated task
     */
    const populatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(
        error,
        "Unable to create task."
      ),
    });
  }
};

/*
|--------------------------------------------------------------------------
| PUT /api/tasks/:id
|--------------------------------------------------------------------------
|
| Update task properties.
|--------------------------------------------------------------------------
*/

const updateTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "project",
      "status",
      "priority",
      "assignee",
      "reviewer",
      "sprint",
      "storyPoints",
      "startDate",
      "dueDate",
      "labels",
      "subtasks",
      "technicalSpecifications",
      "threatModel",
      "acceptanceCriteria",
      "branch",
      "pullRequestUrl",
      "issueUrl",
      "environment",
      "observability",
      "dependencies",
      "estimatedMinutes",
    ];

    const changes = [];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const oldValue = task[field];
        const newValue = req.body[field];

        /*
         * Special handling for references.
         */
        if (
          ["assignee", "reviewer", "project"].includes(
            field
          )
        ) {
          task[field] = newValue || null;
        } else {
          task[field] = newValue;
        }

        if (String(oldValue) !== String(newValue)) {
          changes.push({
            field,
            from: oldValue,
            to: newValue,
          });
        }
      }
    });

    /*
     * Validate project if changed.
     */
    if (req.body.project) {
      if (!isValidObjectId(req.body.project)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      const projectExists = await Project.exists({
        _id: req.body.project,
      });

      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: "Project not found.",
        });
      }
    }

    /*
     * Validate status.
     */
    if (
      req.body.status &&
      !STATUS_VALUES.includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    /*
     * Validate priority.
     */
    if (
      req.body.priority &&
      !PRIORITY_VALUES.includes(req.body.priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority.",
      });
    }

    /*
     * Status activity.
     */
    if (
      req.body.status &&
      req.body.status !== task.status
    ) {
      task.activities.push({
        type: "status",
        message: `Task status changed to ${req.body.status}.`,
        user: userId,
        metadata: {
          status: req.body.status,
        },
      });
    }

    /*
     * Priority activity.
     */
    if (
      req.body.priority &&
      req.body.priority !== task.priority
    ) {
      task.activities.push({
        type: "priority",
        message: `Task priority changed to ${req.body.priority}.`,
        user: userId,
        metadata: {
          priority: req.body.priority,
        },
      });
    }

    /*
     * Assignment activity.
     */
    if (
      req.body.assignee !== undefined &&
      String(req.body.assignee || "") !==
        String(task.assignee || "")
    ) {
      task.activities.push({
        type: "assignment",
        message: "Task assignment was updated.",
        user: userId,
      });
    }

    /*
     * Save.
     */
    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task: updatedTask,
      changes,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(
        error,
        "Unable to update task."
      ),
    });
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/tasks/:id/status
|--------------------------------------------------------------------------
|
| Specifically move a task between Kanban columns.
|--------------------------------------------------------------------------
*/

const updateTaskStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: Backlog, To Do, In Progress, In Review, Done.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const previousStatus = task.status;

    if (previousStatus === status) {
      const unchangedTask = await populateTask(
        Task.findById(task._id)
      );

      return res.status(200).json({
        success: true,
        message: "Task status is already set.",
        task: unchangedTask,
      });
    }

    task.status = status;

    task.activities.push({
      type: "status",
      message: `Task moved from ${previousStatus} to ${status}.`,
      user: userId,
      metadata: {
        from: previousStatus,
        to: status,
      },
    });

    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task status.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| POST /api/tasks/:id/comments
|--------------------------------------------------------------------------
|
| Add a discussion/comment to the activity stream.
|--------------------------------------------------------------------------
*/

const addComment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.activities.push({
      type: "comment",
      message: message.trim(),
      user: userId,
    });

    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add comment.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| POST /api/tasks/:id/subtasks
|--------------------------------------------------------------------------
|
| Add a new subtask.
|--------------------------------------------------------------------------
*/

const addSubtask = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subtask title is required.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.subtasks.push({
      title: title.trim(),
      completed: false,
    });

    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(201).json({
      success: true,
      message: "Subtask added successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Add subtask error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add subtask.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/tasks/:id/subtasks/:subtaskId
|--------------------------------------------------------------------------
|
| Toggle/update a subtask.
|--------------------------------------------------------------------------
*/

const updateSubtask = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, subtaskId } = req.params;
    const { title, completed } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (
      !isValidObjectId(id) ||
      !isValidObjectId(subtaskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task or subtask ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask not found.",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Subtask title cannot be empty.",
        });
      }

      subtask.title = title.trim();
    }

    if (completed !== undefined) {
      subtask.completed = Boolean(completed);
      subtask.completedAt = subtask.completed
        ? new Date()
        : null;
    }

    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(200).json({
      success: true,
      message: "Subtask updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update subtask error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update subtask.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/tasks/:id/time
|--------------------------------------------------------------------------
|
| Update logged time.
|--------------------------------------------------------------------------
*/

const updateTimeLogged = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { minutes } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const numericMinutes = Number(minutes);

    if (
      Number.isNaN(numericMinutes) ||
      numericMinutes < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Logged time must be a valid positive number.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.timeLoggedMinutes = numericMinutes;

    task.activities.push({
      type: "system",
      message: `Time logged updated to ${numericMinutes} minutes.`,
      user: userId,
      metadata: {
        timeLoggedMinutes: numericMinutes,
      },
    });

    await task.save();

    const updatedTask = await populateTask(
      Task.findById(task._id)
    );

    return res.status(200).json({
      success: true,
      message: "Time logged successfully updated.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update time error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update logged time.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE /api/tasks/:id
|--------------------------------------------------------------------------
|
| Soft archive task.
|--------------------------------------------------------------------------
*/

const deleteTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isArchived: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.isArchived = true;

    task.activities.push({
      type: "system",
      message: "Task was archived.",
      user: userId,
    });

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task archived successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to archive task.",
      error: error.message,
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  addComment,
  addSubtask,
  updateSubtask,
  updateTimeLogged,
  deleteTask,
};