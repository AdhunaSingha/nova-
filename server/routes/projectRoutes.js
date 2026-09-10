const express = require("express");

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Project Routes
|--------------------------------------------------------------------------
*/

/*
 * GET /api/projects
 *
 * Retrieve all projects.
 */
router.get(
  "/",
  protect,
  getProjects
);

/*
 * GET /api/projects/:id
 *
 * Retrieve one project.
 */
router.get(
  "/:id",
  protect,
  getProject
);

/*
 * POST /api/projects
 *
 * Create a new project.
 *
 * Project managers and admins can create projects.
 */
router.post(
  "/",
  protect,
  authorize(
    "admin",
    "project-manager"
  ),
  createProject
);

/*
 * PUT /api/projects/:id
 *
 * Update project.
 */
router.put(
  "/:id",
  protect,
  authorize(
    "admin",
    "project-manager"
  ),
  updateProject
);

/*
 * DELETE /api/projects/:id
 *
 * Archive project.
 */
router.delete(
  "/:id",
  protect,
  authorize(
    "admin",
    "project-manager"
  ),
  deleteProject
);

module.exports = router;