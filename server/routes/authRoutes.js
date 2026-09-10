const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

/*
 * Register
 * POST /api/auth/register
 */
router.post("/register", register);

/*
 * Login
 * POST /api/auth/login
 */
router.post("/login", login);

/*
 * Current authenticated user
 * GET /api/auth/me
 *
 * Protected route.
 */
router.get("/me", protect, getMe);

module.exports = router;