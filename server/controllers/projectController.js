const Project = require("../models/Project");
const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| Get All Projects
|--------------------------------------------------------------------------
| GET /api/projects
|--------------------------------------------------------------------------
*/

const getProjects = async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      sort = "updated",
    } = req.query;

    const filter = {
      isArchived: false,
    };

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          key: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    let sortOption = {
      updatedAt: -1,
    };

    if (sort === "deadline") {
      sortOption = {
        deadline: 1,
      };
    }

    if (sort === "progress") {
      sortOption = {
        progress: -1,
      };
    }

    if (sort === "created") {
      sortOption = {
        createdAt: -1,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Query
    |--------------------------------------------------------------------------
    */

    const projects = await Project.find(filter)
      .populate(
        "owner",
        "name email role department avatar"
      )
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "members.user",
        "name email role department avatar"
      )
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(
      "Get projects error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve projects",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Single Project
|--------------------------------------------------------------------------
| GET /api/projects/:id
|--------------------------------------------------------------------------
*/

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    )
      .populate(
        "owner",
        "name email role department avatar"
      )
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "members.user",
        "name email role department avatar"
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve project",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Create Project
|--------------------------------------------------------------------------
| POST /api/projects
|--------------------------------------------------------------------------
*/

const createProject = async (req, res) => {
  try {
    const {
      name,
      key,
      description,
      category,
      status,
      priority,
      owner,
      members,
      startDate,
      deadline,
      progress,
      budget,
      tags,
      techStack,
      repository,
      color,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message: "Project name and key are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check project key
    |--------------------------------------------------------------------------
    */

    const normalizedKey =
      key.trim().toUpperCase();

    const existingProject =
      await Project.findOne({
        key: normalizedKey,
      });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message:
          "A project with this key already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate owner
    |--------------------------------------------------------------------------
    */

    const ownerId = owner || req.user._id;

    const ownerUser = await User.findById(
      ownerId
    );

    if (!ownerUser) {
      return res.status(400).json({
        success: false,
        message: "Project owner not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create project
    |--------------------------------------------------------------------------
    */

    const project = await Project.create({
      name: name.trim(),
      key: normalizedKey,
      description:
        description?.trim() || "",
      category:
        category || "Engineering",
      status:
        status || "Planning",
      priority:
        priority || "Medium",
      owner: ownerId,
      members: Array.isArray(members)
        ? members
        : [],
      startDate:
        startDate || null,
      deadline:
        deadline || null,
      progress:
        Number.isFinite(Number(progress))
          ? Number(progress)
          : 0,
      budget:
        Number.isFinite(Number(budget))
          ? Number(budget)
          : 0,
      tags:
        Array.isArray(tags)
          ? tags
          : [],
      techStack:
        Array.isArray(techStack)
          ? techStack
          : [],
      repository:
        repository?.trim() || "",
      color:
        color || "#8083ff",
      createdBy: req.user._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Populate response
    |--------------------------------------------------------------------------
    */

    await project.populate([
      {
        path: "owner",
        select:
          "name email role department avatar",
      },
      {
        path: "createdBy",
        select: "name email role",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A project with this key already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message:
          messages[0] ||
          "Invalid project information",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Project
|--------------------------------------------------------------------------
| PUT /api/projects/:id
|--------------------------------------------------------------------------
*/

const updateProject = async (req, res) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "status",
      "priority",
      "owner",
      "members",
      "startDate",
      "deadline",
      "progress",
      "budget",
      "tags",
      "techStack",
      "repository",
      "color",
      "isArchived",
    ];

    allowedFields.forEach((field) => {
      if (
        req.body[field] !== undefined
      ) {
        project[field] =
          req.body[field];
      }
    });

    if (req.body.name) {
      project.name =
        req.body.name.trim();
    }

    if (req.body.owner) {
      const ownerUser =
        await User.findById(
          req.body.owner
        );

      if (!ownerUser) {
        return res.status(400).json({
          success: false,
          message:
            "Project owner not found",
        });
      }
    }

    const updatedProject =
      await project.save();

    await updatedProject.populate([
      {
        path: "owner",
        select:
          "name email role department avatar",
      },
      {
        path: "createdBy",
        select: "name email role",
      },
      {
        path: "members.user",
        select:
          "name email role department avatar",
      },
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message:
          messages[0] ||
          "Invalid project information",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete / Archive Project
|--------------------------------------------------------------------------
| DELETE /api/projects/:id
|--------------------------------------------------------------------------
*/

const deleteProject = async (req, res) => {
  try {
    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Soft delete
    |--------------------------------------------------------------------------
    */

    project.isArchived = true;
    project.status = "Archived";

    await project.save();

    return res.status(200).json({
      success: true,
      message:
        "Project archived successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to archive project",
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};