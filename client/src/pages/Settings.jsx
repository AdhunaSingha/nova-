import { useState } from "react";
import "../styles/settings.css";

function Icon({ name, size = 20 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    person: (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.7-3.4 3.1-5.5 7-5.5s6.3 2.1 7 5.5" />
      </svg>
    ),

    business: (
      <svg {...commonProps}>
        <path d="M4 21V4h11v17" />
        <path d="M15 9h5v12" />
        <path d="M8 8h2M8 12h2M8 16h2M12 8h1M12 12h1M12 16h1" />
        <path d="M2 21h20" />
      </svg>
    ),

    notifications: (
      <svg {...commonProps}>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),

    tune: (
      <svg {...commonProps}>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="8" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="10" cy="18" r="2" />
      </svg>
    ),

    shield: (
      <svg {...commonProps}>
        <path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),

    extension: (
      <svg {...commonProps}>
        <path d="M9 3h6v3a2 2 0 1 0 4 0h2v6h-3a2 2 0 1 0 0 4h3v5h-6v-3a2 2 0 1 0-4 0v3H5v-6h3a2 2 0 1 0 0-4H5V7h4V3z" />
      </svg>
    ),

    chevronRight: (
      <svg {...commonProps}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    ),

    photo: (
      <svg {...commonProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m21 16-5-5-7 7" />
      </svg>
    ),

    save: (
      <svg {...commonProps}>
        <path d="M5 3h11l3 3v15H5z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </svg>
    ),

    info: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" />
      </svg>
    ),

    moon: (
      <svg {...commonProps}>
        <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z" />
      </svg>
    ),

    lock: (
      <svg {...commonProps}>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),

    verified: (
      <svg {...commonProps}>
        <path d="m12 3 2 1 2.3-.1 1.2 2 2 1.2-.1 2.3 1 2-1 2-2 1.2.1 2.3-2 1.2-1.2 2-2.3-.1-2 1-2-1-2.3.1-1.2-2-2-1.2.1-2.3-1-2 1-2 2-1.2-.1-2.3 2-1.2 1.2-2 2.3.1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),

    devices: (
      <svg {...commonProps}>
        <rect x="3" y="4" width="13" height="11" rx="1.5" />
        <path d="M7 19h5M9 15v4" />
        <rect x="18" y="8" width="3" height="9" rx="1" />
      </svg>
    ),

    key: (
      <svg {...commonProps}>
        <circle cx="8" cy="15" r="4" />
        <path d="m11 12 8-8M16 5l3 3M14 7l3 3" />
      </svg>
    ),

    code: (
      <svg {...commonProps}>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </svg>
    ),

    chat: (
      <svg {...commonProps}>
        <path d="M4 5h16v11H8l-4 4z" />
        <path d="M8 9h8M8 12h5" />
      </svg>
    ),

    calendar: (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),

    sync: (
      <svg {...commonProps}>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.5 9A6 6 0 0 1 17 6l3 3M4 15l3 3a6 6 0 0 0 10.5-3" />
      </svg>
    ),

    check: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function Settings() {
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Alex Morgan",
    email: "alex.morgan@nova.dev",
    role: "Engineering Manager",
    timezone: "Asia/Kolkata",
    bio: "Building high-performing engineering teams and shipping reliable products.",
  });

  const [workspace, setWorkspace] = useState({
    name: "NOVA Engineering",
    description:
      "Engineering workspace for planning, collaboration and delivery.",
    projectPrefix: "NOVA",
  });

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    taskUpdated: true,
    mentions: true,
    comments: true,
    sprintUpdates: false,
    weeklyReport: true,
  });

  const [preferences, setPreferences] = useState({
    compactMode: false,
    reducedMotion: false,
    emailDigest: true,
  });

  const [toast, setToast] = useState("");

  const navigationItems = [
    {
      id: "profile",
      label: "Profile",
      description: "Personal information",
      icon: "person",
    },
    {
      id: "workspace",
      label: "Workspace",
      description: "Workspace configuration",
      icon: "business",
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Alerts and updates",
      icon: "notifications",
    },
    {
      id: "preferences",
      label: "Preferences",
      description: "Interface preferences",
      icon: "tune",
    },
    {
      id: "security",
      label: "Security",
      description: "Password and access",
      icon: "shield",
    },
    {
      id: "integrations",
      label: "Integrations",
      description: "Connected services",
      icon: "extension",
    },
  ];

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const updateProfile = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateWorkspace = (field, value) => {
    setWorkspace((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleNotification = (field) => {
    setNotifications((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const togglePreference = (field) => {
    setPreferences((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const renderProfile = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">ACCOUNT</p>
          <h2>Profile information</h2>
          <p>
            Manage your personal information and how you appear across NOVA.
          </p>
        </div>
      </div>

      <div className="profile-preview">
        <div className="settings-avatar">AM</div>

        <div className="profile-preview-content">
          <strong>{profile.name}</strong>
          <span>{profile.role}</span>
          <small>{profile.email}</small>
        </div>

        <button
          className="nova-button nova-button-secondary"
          onClick={() => showToast("Profile photo upload is coming soon.")}
        >
          <Icon name="photo" size={17} />
          Change photo
        </button>
      </div>

      <div className="settings-form-grid">
        <div className="settings-field">
          <label htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            className="nova-input"
            value={profile.name}
            onChange={(event) =>
              updateProfile("name", event.target.value)
            }
          />
        </div>

        <div className="settings-field">
          <label htmlFor="profile-email">Email address</label>
          <input
            id="profile-email"
            type="email"
            className="nova-input"
            value={profile.email}
            onChange={(event) =>
              updateProfile("email", event.target.value)
            }
          />
        </div>

        <div className="settings-field">
          <label htmlFor="profile-role">Role</label>
          <input
            id="profile-role"
            className="nova-input"
            value={profile.role}
            onChange={(event) =>
              updateProfile("role", event.target.value)
            }
          />
        </div>

        <div className="settings-field">
          <label htmlFor="profile-timezone">Timezone</label>
          <select
            id="profile-timezone"
            className="nova-input settings-select"
            value={profile.timezone}
            onChange={(event) =>
              updateProfile("timezone", event.target.value)
            }
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">
              America/New_York
            </option>
            <option value="America/Los_Angeles">
              America/Los_Angeles
            </option>
            <option value="Asia/Singapore">Asia/Singapore</option>
          </select>
        </div>

        <div className="settings-field settings-field-full">
          <label htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            className="nova-input settings-textarea"
            value={profile.bio}
            onChange={(event) =>
              updateProfile("bio", event.target.value)
            }
            rows="4"
          />
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="nova-button nova-button-primary"
          onClick={() =>
            showToast("Profile changes saved successfully.")
          }
        >
          <Icon name="save" size={17} />
          Save changes
        </button>
      </div>
    </section>
  );

  const renderWorkspace = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">WORKSPACE</p>
          <h2>Workspace configuration</h2>
          <p>
            Configure the workspace identity used by your team and projects.
          </p>
        </div>
      </div>

      <div className="settings-form-grid">
        <div className="settings-field settings-field-full">
          <label htmlFor="workspace-name">Workspace name</label>
          <input
            id="workspace-name"
            className="nova-input"
            value={workspace.name}
            onChange={(event) =>
              updateWorkspace("name", event.target.value)
            }
          />
        </div>

        <div className="settings-field">
          <label htmlFor="project-prefix">Project prefix</label>
          <input
            id="project-prefix"
            className="nova-input nova-code"
            value={workspace.projectPrefix}
            onChange={(event) =>
              updateWorkspace("projectPrefix", event.target.value)
            }
          />

          <span className="settings-help">
            Used when generating project and task identifiers.
          </span>
        </div>

        <div className="settings-field">
          <label>Workspace status</label>

          <div className="settings-static-value">
            <span className="status-dot active" />
            Operational
          </div>
        </div>

        <div className="settings-field settings-field-full">
          <label htmlFor="workspace-description">Description</label>

          <textarea
            id="workspace-description"
            className="nova-input settings-textarea"
            value={workspace.description}
            onChange={(event) =>
              updateWorkspace("description", event.target.value)
            }
            rows="4"
          />
        </div>
      </div>

      <div className="settings-info-banner">
        <Icon name="info" size={19} />

        <div>
          <strong>Workspace administration</strong>
          <p>
            Workspace settings affect every member, project and task inside
            NOVA.
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="nova-button nova-button-primary"
          onClick={() => showToast("Workspace settings saved.")}
        >
          <Icon name="save" size={17} />
          Save workspace
        </button>
      </div>
    </section>
  );

  const notificationRows = [
    {
      key: "taskAssigned",
      title: "Task assignments",
      description: "Notify me when a task is assigned to me.",
    },
    {
      key: "taskUpdated",
      title: "Task updates",
      description: "Notify me when tasks I'm watching are updated.",
    },
    {
      key: "mentions",
      title: "Mentions",
      description: "Notify me when another member mentions me.",
    },
    {
      key: "comments",
      title: "Comments",
      description: "Notify me about new comments on my tasks.",
    },
    {
      key: "sprintUpdates",
      title: "Sprint updates",
      description: "Receive notifications about sprint progress.",
    },
    {
      key: "weeklyReport",
      title: "Weekly productivity report",
      description: "Receive a weekly summary of workspace activity.",
    },
  ];

  const renderNotifications = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">NOTIFICATIONS</p>
          <h2>Notification preferences</h2>
          <p>
            Decide which NOVA events should generate notifications for you.
          </p>
        </div>
      </div>

      <div className="settings-toggle-list">
        {notificationRows.map((item) => (
          <div className="settings-toggle-row" key={item.key}>
            <div className="settings-toggle-content">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>

            <button
              type="button"
              className={`nova-switch ${
                notifications[item.key] ? "is-on" : ""
              }`}
              aria-label={`Toggle ${item.title}`}
              aria-pressed={notifications[item.key]}
              onClick={() => toggleNotification(item.key)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button
          className="nova-button nova-button-primary"
          onClick={() =>
            showToast("Notification preferences saved.")
          }
        >
          <Icon name="save" size={17} />
          Save preferences
        </button>
      </div>
    </section>
  );

  const preferenceRows = [
    {
      key: "compactMode",
      title: "Compact interface",
      description:
        "Reduce spacing across tables, cards and navigation elements.",
    },
    {
      key: "reducedMotion",
      title: "Reduce motion",
      description:
        "Minimize interface animations and transition effects.",
    },
    {
      key: "emailDigest",
      title: "Email productivity digest",
      description:
        "Receive important activity and productivity updates by email.",
    },
  ];

  const renderPreferences = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">INTERFACE</p>
          <h2>Preferences</h2>
          <p>
            Customize how NOVA behaves and presents information.
          </p>
        </div>
      </div>

      <div className="appearance-card">
        <div className="appearance-icon">
          <Icon name="moon" size={20} />
        </div>

        <div>
          <strong>Dark workspace</strong>
          <p>
            NOVA currently uses the dark workspace interface optimized for
            focused development work.
          </p>
        </div>

        <span className="settings-badge">ACTIVE</span>
      </div>

      <div className="settings-toggle-list">
        {preferenceRows.map((item) => (
          <div className="settings-toggle-row" key={item.key}>
            <div className="settings-toggle-content">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>

            <button
              type="button"
              className={`nova-switch ${
                preferences[item.key] ? "is-on" : ""
              }`}
              aria-label={`Toggle ${item.title}`}
              aria-pressed={preferences[item.key]}
              onClick={() => togglePreference(item.key)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button
          className="nova-button nova-button-primary"
          onClick={() =>
            showToast("Interface preferences saved.")
          }
        >
          <Icon name="save" size={17} />
          Save preferences
        </button>
      </div>
    </section>
  );

  const renderSecurity = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">SECURITY</p>
          <h2>Security & access</h2>
          <p>
            Manage authentication and account security controls.
          </p>
        </div>
      </div>

      <div className="security-grid">
        {[
          {
            icon: "lock",
            title: "Password",
            description: "Last changed 24 days ago",
            action: "Change",
          },
          {
            icon: "verified",
            title: "Two-factor authentication",
            description:
              "Protect your account with an additional verification step.",
            action: "Configure",
          },
          {
            icon: "devices",
            title: "Active sessions",
            description: "3 devices are currently signed in.",
            action: "Review",
          },
          {
            icon: "key",
            title: "API access",
            description:
              "Manage personal API keys and developer access.",
            action: "Manage",
          },
        ].map((item) => (
          <div className="security-card" key={item.title}>
            <div className="security-card-icon">
              <Icon name={item.icon} size={19} />
            </div>

            <div className="security-card-content">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>

            <button
              className="nova-button nova-button-secondary"
              onClick={() =>
                showToast(`${item.title} management is coming soon.`)
              }
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>

      <div className="danger-zone">
        <div>
          <p className="settings-eyebrow danger-eyebrow">
            DANGER ZONE
          </p>
          <h3>Deactivate account</h3>
          <p>
            Temporarily disable your NOVA account and remove access to
            the workspace.
          </p>
        </div>

        <button
          className="nova-button nova-button-danger"
          onClick={() =>
            showToast(
              "Account deactivation is disabled in demo mode."
            )
          }
        >
          Deactivate
        </button>
      </div>
    </section>
  );

  const integrationRows = [
    {
      name: "GitHub",
      description: "Repository activity, commits and pull requests.",
      icon: "code",
      connected: true,
    },
    {
      name: "Slack",
      description: "Receive NOVA activity notifications in Slack.",
      icon: "chat",
      connected: true,
    },
    {
      name: "Google Calendar",
      description: "Synchronize meetings and important deadlines.",
      icon: "calendar",
      connected: false,
    },
    {
      name: "Jira",
      description: "Import and synchronize Jira project activity.",
      icon: "sync",
      connected: false,
    },
  ];

  const renderIntegrations = () => (
    <section className="settings-section">
      <div className="settings-section-heading">
        <div>
          <p className="settings-eyebrow">CONNECTED SERVICES</p>
          <h2>Integrations</h2>
          <p>
            Connect NOVA with the tools your team already uses.
          </p>
        </div>
      </div>

      <div className="integration-list">
        {integrationRows.map((integration) => (
          <div className="integration-row" key={integration.name}>
            <div className="integration-icon">
              <Icon name={integration.icon} size={19} />
            </div>

            <div className="integration-content">
              <strong>{integration.name}</strong>
              <span>{integration.description}</span>
            </div>

            <div className="integration-status">
              {integration.connected ? (
                <span className="connected-status">
                  <span className="status-dot active" />
                  Connected
                </span>
              ) : (
                <span className="settings-badge muted-badge">
                  NOT CONNECTED
                </span>
              )}
            </div>

            <button
              className={
                integration.connected
                  ? "nova-button nova-button-secondary"
                  : "nova-button nova-button-primary"
              }
              onClick={() =>
                showToast(
                  integration.connected
                    ? `${integration.name} configuration is coming soon.`
                    : `${integration.name} connection is coming soon.`
                )
              }
            >
              {integration.connected ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "workspace":
        return renderWorkspace();

      case "notifications":
        return renderNotifications();

      case "preferences":
        return renderPreferences();

      case "security":
        return renderSecurity();

      case "integrations":
        return renderIntegrations();

      case "profile":
      default:
        return renderProfile();
    }
  };

  const activeItem =
    navigationItems.find((item) => item.id === activeSection) ||
    navigationItems[0];

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-breadcrumb">
          <span>NOVA</span>
          <Icon name="chevronRight" size={15} />
          <span>Settings</span>
        </div>

        <div className="settings-title-row">
          <div>
            <p className="settings-eyebrow">
              WORKSPACE CONTROL CENTER
            </p>

            <h1 className="settings-display">
              Settings<span>.</span>
            </h1>

            <p className="settings-subtitle">
              Configure your NOVA workspace, account and productivity
              preferences.
            </p>
          </div>

          <div className="settings-system-status">
            <span className="status-dot active" />

            <div>
              <strong>All systems operational</strong>
              <span>Last checked just now</span>
            </div>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-navigation">
          <div className="settings-nav-label">SETTINGS</div>

          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="settings-nav-icon">
                <Icon name={item.icon} size={19} />
              </span>

              <span className="settings-nav-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>

              {activeSection === item.id && (
                <span className="settings-nav-arrow">
                  <Icon name="chevronRight" size={17} />
                </span>
              )}
            </button>
          ))}

          <div className="settings-nav-footer">
            <Icon name="info" size={17} />

            <div>
              <strong>NOVA v1.0</strong>
              <span>Frontend preview</span>
            </div>
          </div>
        </aside>

        <main className="settings-content">
          <div className="settings-content-heading">
            <div className="settings-current-icon">
              <Icon name={activeItem.icon} size={20} />
            </div>

            <div>
              <h2>{activeItem.label}</h2>
              <p>{activeItem.description}</p>
            </div>
          </div>

          {renderActiveSection()}
        </main>
      </div>

      {toast && (
        <div className="settings-toast">
          <Icon name="check" size={19} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default Settings;