import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const pageNames = {
  "/dashboard": "Workspace",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/team": "Team",
  "/settings": "Settings",
};

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

function getPageName(pathname) {
  if (pathname.startsWith("/projects/")) {
    return "Project";
  }

  if (pathname.startsWith("/tasks/")) {
    return "Task";
  }

  return pageNames[pathname] || "Workspace";
}

function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "admin@nova.io";
  const displayRole = user?.role || "Workspace Admin";
  const initials = getInitials(displayName);

  const pageName = getPageName(location.pathname);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyboard = (event) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isShortcut) {
        event.preventDefault();

        const searchInput =
          document.querySelector(
            ".nova-global-search-input"
          );

        if (searchInput) {
          searchInput.focus();
        }
      }

      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      return;
    }

    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("project") ||
      lowerQuery.includes("portfolio")
    ) {
      navigate("/projects");
      return;
    }

    if (
      lowerQuery.includes("task") ||
      lowerQuery.includes("kanban")
    ) {
      navigate("/tasks");
      return;
    }

    if (
      lowerQuery.includes("team") ||
      lowerQuery.includes("member")
    ) {
      navigate("/team");
      return;
    }

    if (lowerQuery.includes("setting")) {
      navigate("/settings");
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="nova-navbar">
      {/* Mobile menu */}
      <button
        type="button"
        className="nova-mobile-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <span className="material-symbols-rounded">
          menu
        </span>
      </button>

      {/* Breadcrumb */}
      <div className="nova-navbar-breadcrumb">
        <span>NOVA</span>

        <span className="material-symbols-rounded">
          chevron_right
        </span>

        <strong>{pageName}</strong>
      </div>

      {/* Search */}
      <form
        className="nova-global-search"
        onSubmit={handleSearchSubmit}
      >
        <span className="material-symbols-rounded nova-search-icon">
          search
        </span>

        <input
          className="nova-global-search-input"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search projects, tasks, people..."
          aria-label="Search projects, tasks, people"
        />

        <kbd>⌘ K</kbd>
      </form>

      {/* Right side */}
      <div className="nova-navbar-actions">
        {/* Sprint status */}
        <div className="nova-sprint-status">
          <span className="nova-status-dot" />

          <span>Sprint 34:</span>

          <strong>Day 6 / 14</strong>
        </div>

        {/* Help */}
        <button
          type="button"
          className="nova-navbar-icon-button"
          title="Help"
          aria-label="Help"
        >
          <span className="material-symbols-rounded">
            help
          </span>
        </button>

        {/* Notifications */}
        <div
          className="nova-navbar-dropdown-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className="nova-navbar-icon-button nova-notification-button"
            onClick={() =>
              setNotificationsOpen(
                (current) => !current
              )
            }
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <span className="material-symbols-rounded">
              notifications
            </span>

            <span className="nova-notification-dot" />
          </button>

          {notificationsOpen && (
            <div className="nova-navbar-dropdown nova-notifications-dropdown">
              <div className="nova-dropdown-header">
                <div>
                  <strong>Notifications</strong>
                  <span>3 new updates</span>
                </div>

                <span className="material-symbols-rounded">
                  notifications
                </span>
              </div>

              <div className="nova-notification-item">
                <span className="material-symbols-rounded notification-success">
                  check_circle
                </span>

                <div>
                  <strong>Task completed</strong>
                  <span>
                    API Authentication Flow was completed.
                  </span>
                  <small>8 min ago</small>
                </div>
              </div>

              <div className="nova-notification-item">
                <span className="material-symbols-rounded notification-info">
                  rocket_launch
                </span>

                <div>
                  <strong>New deployment</strong>
                  <span>
                    Analytics Platform v2.4.1 deployed.
                  </span>
                  <small>32 min ago</small>
                </div>
              </div>

              <div className="nova-notification-item">
                <span className="material-symbols-rounded notification-warning">
                  warning
                </span>

                <div>
                  <strong>Sprint at risk</strong>
                  <span>
                    Payment Gateway needs attention.
                  </span>
                  <small>2 hrs ago</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div
          className="nova-navbar-dropdown-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className="nova-navbar-profile"
            onClick={() =>
              setProfileOpen((current) => !current)
            }
            aria-expanded={profileOpen}
          >
            <span className="nova-navbar-avatar">
              {initials}
            </span>

            <span className="nova-navbar-profile-copy">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </span>

            <span className="material-symbols-rounded">
              expand_more
            </span>
          </button>

          {profileOpen && (
            <div className="nova-navbar-dropdown nova-profile-dropdown">
              <div className="nova-profile-dropdown-header">
                <div className="nova-profile-avatar-large">
                  {initials}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{displayEmail}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
              >
                <span className="material-symbols-rounded">
                  manage_accounts
                </span>

                Account Settings
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/team");
                }}
              >
                <span className="material-symbols-rounded">
                  groups
                </span>

                Team
              </button>

              <div className="nova-dropdown-divider" />

              <button
                type="button"
                className="nova-logout-button"
                onClick={handleLogout}
              >
                <span className="material-symbols-rounded">
                  logout
                </span>

                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;