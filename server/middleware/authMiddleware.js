const jwt = require("jsonwebtoken");

const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| Protect Routes
|--------------------------------------------------------------------------
|
| Checks for:
| Authorization: Bearer <JWT>
|
*/

const protect = async (req, res, next) => {
  try {
    let token;

    /*
    |--------------------------------------------------------------------------
    | Get token from Authorization header
    |--------------------------------------------------------------------------
    */

    const authHeader = req.headers.authorization;

    if (
      authHeader &&
      authHeader.startsWith("Bearer ")
    ) {
      token = authHeader.split(" ")[1];
    }

    /*
    |--------------------------------------------------------------------------
    | Token missing
    |--------------------------------------------------------------------------
    */

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify JWT
    |--------------------------------------------------------------------------
    */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
    |--------------------------------------------------------------------------
    | Find user
    |--------------------------------------------------------------------------
    |
    | We use the ID stored inside the JWT.
    |
    */

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check account status
    |--------------------------------------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Attach user to request
    |--------------------------------------------------------------------------
    */

    req.user = user;

    next();
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Invalid / expired JWT
    |--------------------------------------------------------------------------
    */

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Optional Role Authorization
|--------------------------------------------------------------------------
|
| Example:
|
| router.delete(
|   "/:id",
|   protect,
|   authorize("admin", "project-manager"),
|   deleteProject
| );
|
*/

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};