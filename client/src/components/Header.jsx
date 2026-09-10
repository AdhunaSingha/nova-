import { useState } from "react";

function Header() {
  const [search, setSearch] = useState("");

  return (
    <header className="nova-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined">
            menu
          </span>
        </button>

        <div className="header-breadcrumb">
          <span className="breadcrumb-muted">
            NOVA
          </span>

          <span className="material-symbols-outlined">
            chevron_right
          </span>

          <span className="breadcrumb-current">
            Workspace
          </span>
        </div>
      </div>

      <div className="header-center">
        <div className="global-search">
          <span className="material-symbols-outlined">
            search
          </span>

          <input
            type="search"
            placeholder="Search projects, tasks, people..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-action-button"
          aria-label="Help"
        >
          <span className="material-symbols-outlined">
            help
          </span>
        </button>

        <button
          type="button"
          className="header-action-button notification-button"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">
            notifications
          </span>

          <span className="notification-dot"></span>
        </button>

        <div className="header-divider"></div>

        <button
          type="button"
          className="header-profile"
        >
          <div className="header-avatar">
            AS
          </div>

          <div className="header-profile-info">
            <span>Admin</span>
            <small>Engineering</small>
          </div>

          <span className="material-symbols-outlined">
            expand_more
          </span>
        </button>
      </div>
    </header>
  );
}

export default Header;