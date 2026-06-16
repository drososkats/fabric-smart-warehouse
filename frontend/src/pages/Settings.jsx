import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { API_URL } from "../config";

const Settings = () => {
  // state management
  const [user, setUser] = useState({ _id: "", username: "", email: "", role: "", password: "" });
  const [originalUser, setOriginalUser] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // initialization - load user from local storage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const initialData = { ...parsed, password: "" };
      setUser(initialData);
      setOriginalUser(initialData);
    }
  }, []);

  // form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
    if (error) setError("");
  };

  // validation before saving
  const handleSaveClick = (e) => {
    e.preventDefault();
    setError("");

    const hasChanges = user.username !== originalUser.username || user.email !== originalUser.email || 
                       user.role !== originalUser.role || user.password.length > 0;

    if (!hasChanges) return setError("No changes detected.");
    if (!user.username || !user.email) return setError("Username and Email are required.");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) return setError("Invalid email format.");

    setShowConfirmModal(true);
  };

  // api call - execute updates
  const executeSaveChanges = async () => {
    try {
      const updates = { username: user.username, email: user.email, role: user.role };
      if (user.password.length > 0) updates.password = user.password;

      const response = await fetch(`${API_URL}/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      // update localstorage and state
      const currentStorage = JSON.parse(localStorage.getItem("user"));
      const updatedData = { ...currentStorage, ...data };
      localStorage.setItem("user", JSON.stringify(updatedData));
      
      const nextState = { ...updatedData, password: "" };
      setUser(nextState);
      setOriginalUser(nextState);

      toast.success("Profile updated successfully");
      setShowConfirmModal(false);
    } catch (err) {
      toast.error(err.message || "Server Error");
      setShowConfirmModal(false);
    }
  };

  return (
    <div className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`} id="wrapper">
      <Sidebar role={user.role} activePage="/settings" isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} />

      <div id="page-content-wrapper" className="w-100">
        <Navbar title="Account Settings" />

        <div className="container-fluid p-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-success text-white py-3">
                  <h5 className="mb-0 fw-bold">Edit Profile</h5>
                </div>

                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-danger py-2 d-flex align-items-center">
                      <img src="/icons/error.png" alt="error" className="me-2" style={{ width: "20px" }} />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSaveClick}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Username</label>
                      <input type="text" className="form-control" name="username" value={user.username} onChange={handleChange} />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input type="email" className="form-control" name="email" value={user.email} onChange={handleChange} />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">New Password (optional)</label>
                      <input type="password" className="form-control" name="password" value={user.password} onChange={handleChange} placeholder="Leave blank to keep current" />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Role</label>
                      {originalUser?.role === "admin" ? (
                        <select className="form-select" name="role" value={user.role} onChange={handleChange}>
                          <option value="admin">Admin</option>
                          <option value="store_manager">Store Manager</option>
                          <option value="user">User</option>
                          <option value="vendor">Vendor</option>
                        </select>
                      ) : (
                        <input type="text" className="form-control bg-light" value={user.role} readOnly />
                      )}
                    </div>

                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-success px-4 fw-bold">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* confirmation modal */}
        {showConfirmModal && (
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">Confirm Changes</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
                </div>
                <div className="modal-body text-center py-4">
                  <h5>Update your profile details?</h5>
                  <p className="text-muted">Changes will be saved to the database.</p>
                </div>
                <div className="modal-footer justify-content-center border-0">
                  <button className="btn btn-secondary px-4" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  <button className="btn btn-success px-4" onClick={executeSaveChanges}>Yes, Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;