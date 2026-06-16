import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

const Navbar = ({ title }) => {
  // --- STATE ---
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [weather, setWeather] = useState(null);

  // --- NOTIFICATION STATE ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef(null);

  // --- 1. FETCH USER DATA ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserId(parsedUser._id);
        if (parsedUser.username) setUsername(parsedUser.username);
        else if (parsedUser.email) setUsername(parsedUser.email.split("@")[0]);
        if (parsedUser.email) setEmail(parsedUser.email);
        if (parsedUser.role) setRole(parsedUser.role);
      } catch (error) {
        console.error("Error parsing user data", error);
      }
    }
  }, []);

  // --- 2. FETCH WEATHER (External API) ---
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.98&longitude=23.72&current_weather=true",
        );
        const data = await response.json();
        setWeather(data.current_weather);
      } catch (error) {
        console.error("Weather fetch failed", error);
      }
    };
    fetchWeather();
  }, []);

  // --- 3. FETCH NOTIFICATIONS (Filtered by User) ---
  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications?userId=${currentUserId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Notification fetch error", error);
    }
  };

  // Sync notifications when user is identified and every 30s
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // --- 4. MARK AS READ (Optimistic & Persistent) ---
  const markAsRead = async (id) => {
    if (!currentUserId) return;

    // Check if already read to avoid unnecessary API calls
    const targetNotif = notifications.find((n) => n._id === id);
    if (targetNotif?.readBy?.includes(currentUserId)) return;

    // A. Optimistic Update (Immediate UI change)
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id
          ? { ...n, readBy: [...(n.readBy || []), currentUserId] }
          : n,
      ),
    );

    // B. Server Update
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        // Fallback if server fails
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
      fetchNotifications();
    }
  };

  // --- HELPERS & HANDLERS ---
  const unreadCount = notifications.filter(
    (n) => currentUserId && n.readBy && !n.readBy.includes(currentUserId),
  ).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const getNotifStyle = (type) => {
    switch (type) {
      case "success":
        return { color: "success", icon: "/icons/new.png", label: "New Entry" };
      case "danger":
        return { color: "danger", icon: "/icons/delete.png", label: "Deleted" };
      case "info":
        return { color: "primary", icon: "/icons/new.png", label: "Updated" };
      default:
        return { color: "secondary", icon: "/icons/no.png", label: "System" };
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-light bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm"
        style={{ zIndex: 1040 }}
      >
        <h2 className="m-0 text-dark fs-4 fw-bold">{title}</h2>

        <div className="d-flex align-items-center gap-4">
          {/* BELL ICON */}
          <div
            className="position-relative"
            style={{ cursor: "pointer" }}
            onClick={() => setShowNotifications(true)}
          >
            <img
              src="/icons/notification.png"
              alt="Notifications"
              style={{ width: "24px", height: "24px" }}
            />
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.6rem" }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* WEATHER WIDGET */}
          <div className="d-none d-md-flex align-items-center bg-light px-3 py-2 rounded-pill border">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>
              {weather ? (weather.temperature > 20 ? "☀️" : "☁️") : "⏳"}
            </span>
            <div className="d-flex flex-column" style={{ lineHeight: "1.2" }}>
              <span
                className="fw-bold text-dark"
                style={{ fontSize: "0.9rem" }}
              >
                {weather ? `${weather.temperature}°C` : "--"}
              </span>
              <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                Athens, GR
              </small>
            </div>
          </div>

          {/* USER PROFILE DROPDOWN */}
          <div className="position-relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="rounded-circle shadow-sm"
              style={{
                width: "45px",
                height: "45px",
                cursor: "pointer",
                overflow: "hidden",
                border: "2px solid #dee2e6",
              }}
            >
              <img
                src="/icons/avatar-user.png"
                alt="User"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {showDropdown && (
              <div
                className="position-absolute end-0 mt-2 bg-white rounded shadow border"
                style={{ width: "240px", zIndex: 1000 }}
              >
                <div className="p-3 border-bottom bg-light">
                  <p className="m-0 fw-bold text-dark text-truncate">
                    {username}
                  </p>
                  <small className="text-muted text-truncate d-block">
                    {email}
                  </small>
                  <span className="badge bg-secondary mt-2">{role}</span>
                </div>
                <div className="py-2">
                  {role === "admin" && (
                    <Link
                      to="/usersadmin"
                      className="dropdown-item px-3 py-2 text-dark d-flex align-items-center gap-3"
                      onClick={() => setShowDropdown(false)}
                    >
                      <img
                        src="/icons/usersadmin.png"
                        alt="users"
                        style={{ width: "18px" }}
                      />
                      Users Management
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="dropdown-item px-3 py-2 text-dark d-flex align-items-center gap-3"
                    onClick={() => setShowDropdown(false)}
                  >
                    <img
                      src="/icons/settings.png"
                      alt="settings"
                      style={{ width: "18px" }}
                    />
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item px-3 py-2 text-danger fw-bold d-flex align-items-center gap-3"
                  >
                    <img
                      src="/icons/logout.png"
                      alt="logout"
                      style={{ width: "18px" }}
                    />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* OFFCANVAS NOTIFICATIONS */}
      <div
        className={`offcanvas offcanvas-end ${showNotifications ? "show" : ""}`}
        tabIndex="-1"
        style={{
          visibility: showNotifications ? "visible" : "hidden",
          zIndex: 1050,
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="offcanvas-header bg-dark text-white shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.5rem" }}>🔔</span>
            <h5 className="offcanvas-title fw-bold">Notifications</h5>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowNotifications(false)}
          ></button>
        </div>

        <div className="offcanvas-body p-3">
          {notifications.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-50 text-muted">
              <img
                src="/icons/no.png"
                alt="No data"
                style={{ width: "48px", opacity: 0.3, marginBottom: "10px" }}
              />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map((notif) => {
                const style = getNotifStyle(notif.type);
                const isRead =
                  notif.readBy && notif.readBy.includes(currentUserId);

                return (
                  <div
                    key={notif._id}
                    className="card border-0 shadow-sm"
                    onClick={() => markAsRead(notif._id)}
                    style={{
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      opacity: isRead ? 0.6 : 1,
                      borderLeft: isRead
                        ? "4px solid #ccc"
                        : `4px solid var(--bs-${style.color})`,
                    }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={style.icon}
                            alt={style.label}
                            style={{
                              width: "22px",
                              height: "22px",
                              filter: isRead ? "grayscale(100%)" : "none",
                            }}
                          />
                          <h6
                            className={`fw-bold mb-0 ${isRead ? "text-muted" : `text-${style.color}`}`}
                          >
                            {style.label}
                          </h6>
                        </div>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                      <p
                        className={`mb-0 small ${isRead ? "text-muted" : "text-dark"}`}
                        style={{ lineHeight: "1.4" }}
                      >
                        {notif.message.replace(/🆕|✏️|🗑️/g, "").trim()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showNotifications && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setShowNotifications(false)}
          style={{ zIndex: 1045 }}
        ></div>
      )}
    </>
  );
};

export default Navbar;