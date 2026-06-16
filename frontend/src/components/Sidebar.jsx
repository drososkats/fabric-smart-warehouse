import React from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "../config";

const Sidebar = ({ isExpanded, toggleSidebar }) => {
  const location = useLocation();

  // safe retrieval of user data from localstorage
  let token = "";
  let role = "user";

  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      token = userObj.token || "";
      role = userObj.role || "user";
    }
  } catch (err) { console.error("storage error:", err); }

  // menu items configuration
  const menuItems = [
    { path: "/dashboard", name: "Dashboard", icon: "/icons/dashboard.png", show: true },
    { path: "/inventory", name: "Inventory List", icon: "/icons/inventory.png", show: true },
    { path: "/add-product", name: "Add Product", icon: "/icons/add.png", show: role !== "vendor" },
    { path: "/analytics", name: "Analytics", icon: "/icons/analytics.png", show: role === "admin" || role === "store_manager" },
  ];

  const iconStyle = { width: "24px", height: "24px", marginRight: isExpanded ? "15px" : "0", objectFit: "contain" };

  return (
    <div className="bg-white" id="sidebar-wrapper">
      {/* sidebar header with toggle button */}
      <div className="sidebar-heading text-center py-4 primary-text fs-4 fw-bold text-uppercase border-bottom">
        <div className="d-flex align-items-center justify-content-between w-100 px-2">
          <span className={`sidebar-text ${!isExpanded ? "d-none" : ""}`}>Fabric ERP</span>
          <div onClick={toggleSidebar} style={{ marginLeft: isExpanded ? "auto" : "0", cursor: "pointer" }}>
            <div className={`hamburger-icon ${isExpanded ? "open" : ""}`}>
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      {/* dynamic list of menu items */}
      <div className="list-group list-group-flush my-3">
        {menuItems.filter(item => item.show).map(item => (
          <Link key={item.path} to={item.path} title={item.name}
                className={`list-group-item list-group-item-action bg-transparent second-text fw-bold ${location.pathname === item.path ? "active" : ""}`}>
            <img src={item.icon} alt={item.name} style={iconStyle} />
            <span className="sidebar-text">{item.name}</span>
          </Link>
        ))}

        {/* security-protected report link */}
        {(role === "admin" || role === "store_manager") && (
          <a href={token ? `${API_URL}/report?token=${token}&role=${role}` : "#"}
             className="list-group-item list-group-item-action bg-transparent text-warning fw-bold"
             target={token ? "_blank" : "_self"} rel="noopener noreferrer"
             onClick={(e) => { if (!token) { e.preventDefault(); alert("Security Check Failed: Please Logout and Login again."); } }}>
            <img src="/icons/report.png" alt="Report" style={iconStyle} />
            <span className="sidebar-text">View Report</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default Sidebar;