import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigationGroups = [
  {
    label: "WORKSPACE",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "dashboard",
      },
      {
        label: "Projects",
        path: "/projects",
        icon: "folder_open",
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: "checklist",
      },
      {
        label: "Team",
        path: "/team",
        icon: "groups",
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: "settings",
      },
    ],
  },
];

function getInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "N";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "admin@nova.io";
  const displayRole = user?.role || "Workspace Admin";
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNavigation = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`nova-sidebar ${
        isOpen ? "nova-sidebar-open" : ""
      }`}
    >
      {/* Brand */}
      <div className="nova-sidebar-brand">
        <button
          type="button"
          className="nova-brand-button"
          onClick={() => {
            navigate("/dashboard");
            handleNavigation();
          }}
          aria-label="Go to dashboard"
        >
          <span className="nova-brand-mark">
            <span className="nova-brand-mark-inner">N</span>
          </span>

          <span className="nova-brand-name">NOVA</span>

          <span className="nova-brand-badge">CLOUD</span>
        </button>

        <button
          type="button"
          className="nova-mobile-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <span className="material-symbols-rounded">
            close
          </span>
        </button>
      </div>

      {/* Workspace */}
      <div className="nova-workspace-card">
        <div className="nova-workspace-icon">
          {initials.slice(0, 1)}
        </div>

        <div className="nova-workspace-copy">
          <strong>NOVA Engineering</strong>
          <span>Engineering Workspace</span>
        </div>

        <span className="material-symbols-rounded nova-workspace-arrow">
          unfold_more
        </span>
      </div>

      {/* Navigation */}
      <nav className="nova-sidebar-nav">
        {navigationGroups.map((group) => (
          <div
            className="nova-nav-group"
            key={group.label}
          >
            <div className="nova-nav-group-label">
              {group.label}
            </div>

            <div className="nova-nav-items">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `nova-nav-item ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="material-symbols-rounded nova-nav-icon">
                    {item.icon}
                  </span>

                  <span className="nova-nav-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="nova-sidebar-bottom">
        {/* System status */}
        <div className="nova-system-status">
          <div className="nova-system-status-heading">
            <span className="nova-status-dot" />

            <span>System Operational</span>
          </div>

          <div className="nova-system-status-detail">
            API v1.0 • Connected
          </div>
        </div>

        {/* User */}
        <div className="nova-sidebar-user">
          <div className="nova-user-avatar">
            {initials}
          </div>

          <div className="nova-user-copy">
            <strong>{displayName}</strong>
            <span>{displayEmail}</span>
          </div>

          <button
            type="button"
            className="nova-user-menu"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <span className="material-symbols-rounded">
              logout
            </span>
          </button>
        </div>

        <div className="nova-user-role">
          {displayRole}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;