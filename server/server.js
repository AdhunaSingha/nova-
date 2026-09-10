const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";


/*
=========================================================
DATABASE
=========================================================
*/

connectDB();


/*
=========================================================
MIDDLEWARE
=========================================================
*/

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


/*
=========================================================
API ROUTES
=========================================================
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/tasks",
  taskRoutes
);

app.use(
  "/api/team",
  teamRoutes
);


/*
=========================================================
ROOT ROUTE
=========================================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NOVA API is running",
    version: "1.0.0",
  });
});


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "NOVA backend is healthy",
      database: "MongoDB",
      timestamp:
        new Date().toISOString(),
    });
  }
);


/*
=========================================================
404 HANDLER
=========================================================
*/

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);


/*
=========================================================
START SERVER
=========================================================
*/

app.listen(
  PORT,
  () => {
    console.log(
      "----------------------------------------"
    );

    console.log(
      "NOVA Backend"
    );

    console.log(
      "----------------------------------------"
    );

    console.log(
      `Server running on: http://localhost:${PORT}`
    );

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Auth API: http://localhost:${PORT}/api/auth`
    );

    console.log(
      `Projects API: http://localhost:${PORT}/api/projects`
    );

    console.log(
      `Tasks API: http://localhost:${PORT}/api/tasks`
    );

    console.log(
      `Team API: http://localhost:${PORT}/api/team`
    );

    console.log(
      "----------------------------------------"
    );
  }
);