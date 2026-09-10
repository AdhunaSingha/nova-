const express = require("express");

const {
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
} = require("../controllers/taskController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Task Routes
|--------------------------------------------------------------------------
*/

/*
 * GET /api/tasks
 * Get all tasks
 */
router.get("/", protect, getTasks);

/*
 * GET /api/tasks/:id
 * Get a single task
 */
router.get("/:id", protect, getTask);

/*
 * POST /api/tasks
 * Create a task
 */
router.post(
  "/",
  protect,
  authorize("admin", "project-manager", "member"),
  createTask
);

/*
 * PUT /api/tasks/:id
 * Update a task
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "project-manager", "member"),
  updateTask
);

/*
 * PATCH /api/tasks/:id/status
 * Move task between Kanban columns
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "project-manager", "member"),
  updateTaskStatus
);

/*
 * POST /api/tasks/:id/comments
 * Add a comment
 */
router.post(
  "/:id/comments",
  protect,
  authorize("admin", "project-manager", "member"),
  addComment
);

/*
 * POST /api/tasks/:id/subtasks
 * Add a subtask
 */
router.post(
  "/:id/subtasks",
  protect,
  authorize("admin", "project-manager", "member"),
  addSubtask
);

/*
 * PATCH /api/tasks/:id/subtasks/:subtaskId
 * Update a subtask
 */
router.patch(
  "/:id/subtasks/:subtaskId",
  protect,
  authorize("admin", "project-manager", "member"),
  updateSubtask
);

/*
 * PATCH /api/tasks/:id/time
 * Update logged time
 */
router.patch(
  "/:id/time",
  protect,
  authorize("admin", "project-manager", "member"),
  updateTimeLogged
);

/*
 * DELETE /api/tasks/:id
 * Archive a task
 */
router.delete(
  "/:id",
  protect,
  authorize("admin", "project-manager"),
  deleteTask
);

module.exports = router;