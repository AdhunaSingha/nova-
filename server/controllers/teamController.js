const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

/*
|--------------------------------------------------------------------------
| GET TEAM
|--------------------------------------------------------------------------
| Returns all registered users with:
| - projects
| - task statistics
| - workload
| - capacity
| - realtime-style status
|--------------------------------------------------------------------------
*/
const getTeam = async (req, res) => {
  try {
    const [users, projects, tasks] = await Promise.all([
      User.find({})
        .select("-password")
        .lean(),

      Project.find({
        isArchived: false,
      })
        .populate(
          "members.user",
          "name email role avatar profileImage photoURL"
        )
        .lean(),

      Task.find({
        isArchived: false,
      })
        .populate(
          "assignee",
          "name email role avatar profileImage photoURL"
        )
        .populate(
          "project",
          "name key category"
        )
        .lean(),
    ]);

    const membersMap = new Map();

    /*
    |--------------------------------------------------------------------------
    | Add every registered user
    |--------------------------------------------------------------------------
    */

    users.forEach((user) => {
      membersMap.set(user._id.toString(), {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        workspace: user.workspace,
        avatar: user.avatar,
        bio: user.bio,
        timezone: user.timezone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,

        projects: [],
        projectNames: [],
        projectIds: [],

        activeTasks: 0,
        completedTasks: 0,
        reviewTasks: 0,
        overdueTasks: 0,

        storyPoints: 0,
        completedStoryPoints: 0,

        estimatedMinutes: 0,
        workloadHours: 0,
        capacityHours: 40,

        status: "AWAY",
        statusLabel: "Away",

        capacityPercentage: 0,
        capacityStatus: "AVAILABLE",
      });
    });

    /*
    |--------------------------------------------------------------------------
    | Add project membership
    |--------------------------------------------------------------------------
    */

    projects.forEach((project) => {
      if (!project.members) {
        return;
      }

      project.members.forEach((member) => {
        if (!member.user) {
          return;
        }

        const userId = member.user._id.toString();

        if (!membersMap.has(userId)) {
          membersMap.set(userId, {
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            role: member.user.role,
            department: "",
            workspace: "",
            avatar: member.user.avatar || "",
            bio: "",
            timezone: "Asia/Kolkata",
            isActive: true,
            lastLogin: null,

            projects: [],
            projectNames: [],
            projectIds: [],

            activeTasks: 0,
            completedTasks: 0,
            reviewTasks: 0,
            overdueTasks: 0,

            storyPoints: 0,
            completedStoryPoints: 0,

            estimatedMinutes: 0,
            workloadHours: 0,
            capacityHours: 40,

            status: "AWAY",
            statusLabel: "Away",

            capacityPercentage: 0,
            capacityStatus: "AVAILABLE",
          });
        }

        const memberData = membersMap.get(userId);

        const alreadyAdded = memberData.projectIds.some(
          (id) => id.toString() === project._id.toString()
        );

        if (!alreadyAdded) {
          memberData.projectIds.push(project._id);
          memberData.projectNames.push(project.name);

          memberData.projects.push({
            _id: project._id,
            name: project.name,
            key: project.key,
            role: member.role,
          });
        }
      });
    });

    /*
    |--------------------------------------------------------------------------
    | Process task assignments
    |--------------------------------------------------------------------------
    */

    const now = new Date();

    tasks.forEach((task) => {
      if (!task.assignee) {
        return;
      }

      const userId = task.assignee._id.toString();

      if (!membersMap.has(userId)) {
        membersMap.set(userId, {
          _id: task.assignee._id,
          name: task.assignee.name,
          email: task.assignee.email,
          role: task.assignee.role,
          department: "",
          workspace: "",
          avatar: task.assignee.avatar || "",
          bio: "",
          timezone: "Asia/Kolkata",
          isActive: true,
          lastLogin: null,

          projects: [],
          projectNames: [],
          projectIds: [],

          activeTasks: 0,
          completedTasks: 0,
          reviewTasks: 0,
          overdueTasks: 0,

          storyPoints: 0,
          completedStoryPoints: 0,

          estimatedMinutes: 0,
          workloadHours: 0,
          capacityHours: 40,

          status: "AWAY",
          statusLabel: "Away",

          capacityPercentage: 0,
          capacityStatus: "AVAILABLE",
        });
      }

      const memberData = membersMap.get(userId);

      /*
      |--------------------------------------------------------------------------
      | Task status statistics
      |--------------------------------------------------------------------------
      */

      if (task.status === "Done") {
        memberData.completedTasks += 1;
      } else {
        memberData.activeTasks += 1;
      }

      if (task.status === "In Review") {
        memberData.reviewTasks += 1;
      }

      /*
      |--------------------------------------------------------------------------
      | Story points
      |--------------------------------------------------------------------------
      */

      const storyPoints = Number(task.storyPoints) || 0;

      memberData.storyPoints += storyPoints;

      if (task.status === "Done") {
        memberData.completedStoryPoints += storyPoints;
      }

      /*
      |--------------------------------------------------------------------------
      | Estimated workload
      |--------------------------------------------------------------------------
      */

      const estimatedMinutes =
        Number(task.estimatedMinutes) || 0;

      memberData.estimatedMinutes += estimatedMinutes;

      /*
      |--------------------------------------------------------------------------
      | Overdue tasks
      |--------------------------------------------------------------------------
      */

      if (
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "Done"
      ) {
        memberData.overdueTasks += 1;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Calculate workload and status
    |--------------------------------------------------------------------------
    */

    const members = Array.from(
      membersMap.values()
    ).map((member) => {
      /*
      | If estimated time is available,
      | use it to calculate workload.
      |
      | Otherwise:
      | story points × 2 hours
      */

      if (member.estimatedMinutes > 0) {
        member.workloadHours =
          Math.round(
            (member.estimatedMinutes / 60) * 10
          ) / 10;
      } else {
        member.workloadHours =
          member.storyPoints * 2;
      }

      member.capacityPercentage =
        Math.round(
          (member.workloadHours /
            member.capacityHours) *
            100
        );

      /*
      |--------------------------------------------------------------------------
      | Capacity status
      |--------------------------------------------------------------------------
      */

      if (member.capacityPercentage >= 100) {
        member.capacityStatus = "OVERLOADED";
      } else if (member.capacityPercentage >= 80) {
        member.capacityStatus = "HIGH";
      } else {
        member.capacityStatus = "AVAILABLE";
      }

      /*
      |--------------------------------------------------------------------------
      | Realtime-style status
      |--------------------------------------------------------------------------
      */

      if (!member.isActive) {
        member.status = "INACTIVE";
        member.statusLabel = "Inactive";
      } else if (member.reviewTasks > 0) {
        member.status = "REVIEW";
        member.statusLabel = "In Review";
      } else if (member.activeTasks > 0) {
        member.status = "ACTIVE";
        member.statusLabel = "Active";
      } else {
        member.status = "AWAY";
        member.statusLabel = "Away";
      }

      return member;
    });

    /*
    |--------------------------------------------------------------------------
    | Team totals
    |--------------------------------------------------------------------------
    */

    const totalMembers = members.length;

    const activeMembers = members.filter(
      (member) =>
        member.isActive &&
        member.status === "ACTIVE"
    ).length;

    const reviewMembers = members.filter(
      (member) =>
        member.isActive &&
        member.status === "REVIEW"
    ).length;

    const overallocatedMembers =
      members.filter(
        (member) =>
          member.capacityPercentage >= 100
      ).length;

    const totalTasks = members.reduce(
      (total, member) =>
        total +
        member.activeTasks +
        member.completedTasks,
      0
    );

    const activeTasks = members.reduce(
      (total, member) =>
        total + member.activeTasks,
      0
    );

    const completedTasks = members.reduce(
      (total, member) =>
        total + member.completedTasks,
      0
    );

    const averageCapacity =
      totalMembers > 0
        ? Math.round(
            members.reduce(
              (total, member) =>
                total + member.capacityPercentage,
              0
            ) / totalMembers
          )
        : 0;

    const uniqueProjects = new Set();

    projects.forEach((project) => {
      uniqueProjects.add(
        project._id.toString()
      );
    });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.status(200).json({
      success: true,

      data: {
        members,

        totals: {
          members: totalMembers,
          active: activeMembers,
          review: reviewMembers,
          overallocated: overallocatedMembers,

          totalTasks,
          activeTasks,
          completedTasks,

          averageCapacity,

          projects: uniqueProjects.size,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get team error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load team members",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| CREATE TEAM MEMBER
|--------------------------------------------------------------------------
| Admin and Project Manager only.
|--------------------------------------------------------------------------
*/

const createMember = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Permission
    |--------------------------------------------------------------------------
    */

    if (
      !req.user ||
      ![
        "admin",
        "project-manager",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to add team members",
      });
    }

    const {
      name,
      email,
      role,
      department,
      password,
      bio,
      timezone,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Name and email are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Check duplicate email
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate role
    |--------------------------------------------------------------------------
    */

    const allowedRoles = [
      "admin",
      "project-manager",
      "developer",
      "designer",
      "qa",
      "member",
    ];

    const finalRole =
      role || "member";

    if (
      !allowedRoles.includes(
        finalRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate department
    |--------------------------------------------------------------------------
    */

    const allowedDepartments = [
      "Engineering",
      "Design",
      "Product",
      "QA & Automation",
      "Management",
    ];

    const finalDepartment =
      department || "Engineering";

    if (
      !allowedDepartments.includes(
        finalDepartment
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid department",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate temporary password
    |--------------------------------------------------------------------------
    */

    let finalPassword =
      password;

    let temporaryPassword = null;

    if (!finalPassword) {
      temporaryPassword =
        `NOVA@${Math.random()
          .toString(36)
          .slice(2, 10)}`;

      finalPassword =
        temporaryPassword;
    }

    /*
    |--------------------------------------------------------------------------
    | Hash password
    |--------------------------------------------------------------------------
    */

    const hashedPassword =
      await bcrypt.hash(
        finalPassword,
        10
      );

    /*
    |--------------------------------------------------------------------------
    | Create user
    |--------------------------------------------------------------------------
    */

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,

        password:
          hashedPassword,

        role: finalRole,

        department:
          finalDepartment,

        bio:
          bio?.trim() || "",

        timezone:
          timezone ||
          "Asia/Kolkata",

        isActive: true,
      });

    /*
    |--------------------------------------------------------------------------
    | Remove password from response
    |--------------------------------------------------------------------------
    */

    const userResponse =
      user.toObject();

    delete userResponse.password;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.status(201).json({
      success: true,
      message:
        "Team member created successfully",

      data: {
        member: userResponse,

        temporaryPassword,
      },
    });
  } catch (error) {
    console.error(
      "Create member error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | Duplicate MongoDB index error
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validation error
    |--------------------------------------------------------------------------
    */

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          Object.values(error.errors)
            .map(
              (err) => err.message
            )
            .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create team member",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TEAM MEMBER
|--------------------------------------------------------------------------
| Admin and Project Manager only.
|
| This updates:
| - name
| - email
| - role
| - department
| - bio
| - timezone
| - active/inactive status
|
| Password is intentionally NOT changed here.
|--------------------------------------------------------------------------
*/

const updateMember = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Permission
    |--------------------------------------------------------------------------
    */

    if (
      !req.user ||
      ![
        "admin",
        "project-manager",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update team members",
      });
    }

    const {
      name,
      email,
      role,
      department,
      bio,
      timezone,
      isActive,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Find member
    |--------------------------------------------------------------------------
    */

    const member =
      await User.findById(
        req.params.id
      );

    if (!member) {
      return res.status(404).json({
        success: false,
        message:
          "Team member not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (
      name !== undefined
    ) {
      if (
        !name ||
        name.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be at least 2 characters long",
        });
      }

      member.name =
        name.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Email
    |--------------------------------------------------------------------------
    */

    if (
      email !== undefined
    ) {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Email cannot be empty",
        });
      }

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: member._id,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Another user already uses this email",
        });
      }

      member.email =
        normalizedEmail;
    }

    /*
    |--------------------------------------------------------------------------
    | Role
    |--------------------------------------------------------------------------
    */

    if (
      role !== undefined
    ) {
      const allowedRoles = [
        "admin",
        "project-manager",
        "developer",
        "designer",
        "qa",
        "member",
      ];

      if (
        !allowedRoles.includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role",
        });
      }

      member.role = role;
    }

    /*
    |--------------------------------------------------------------------------
    | Department
    |--------------------------------------------------------------------------
    */

    if (
      department !== undefined
    ) {
      const allowedDepartments = [
        "Engineering",
        "Design",
        "Product",
        "QA & Automation",
        "Management",
      ];

      if (
        !allowedDepartments.includes(
          department
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid department",
        });
      }

      member.department =
        department;
    }

    /*
    |--------------------------------------------------------------------------
    | Bio
    |--------------------------------------------------------------------------
    */

    if (
      bio !== undefined
    ) {
      member.bio =
        bio.trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Timezone
    |--------------------------------------------------------------------------
    */

    if (
      timezone !== undefined
    ) {
      member.timezone =
        timezone;
    }

    /*
    |--------------------------------------------------------------------------
    | Active / Inactive
    |--------------------------------------------------------------------------
    */

    if (
      isActive !== undefined
    ) {
      member.isActive =
        Boolean(isActive);
    }

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await member.save();

    /*
    |--------------------------------------------------------------------------
    | Response without password
    |--------------------------------------------------------------------------
    */

    const memberResponse =
      member.toObject();

    delete memberResponse.password;

    res.status(200).json({
      success: true,
      message:
        "Team member updated successfully",

      data: {
        member:
          memberResponse,
      },
    });
  } catch (error) {
    console.error(
      "Update member error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | Duplicate email
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Mongoose validation
    |--------------------------------------------------------------------------
    */

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          Object.values(error.errors)
            .map(
              (err) => err.message
            )
            .join(", "),
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Server error
    |--------------------------------------------------------------------------
    */

    res.status(500).json({
      success: false,
      message:
        "Failed to update team member",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getTeam,
  createMember,
  updateMember,
};