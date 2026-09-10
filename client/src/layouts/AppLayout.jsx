import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/layout.css";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="nova-app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="nova-mobile-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <div className="nova-main-shell">
        <Navbar onMenuClick={toggleSidebar} />

        <main className="nova-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;