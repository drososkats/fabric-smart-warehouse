import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { API_URL } from "../config";

const UsersAdmin = () => {
  // state management
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ role: "user", id: "" });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);

  // initialization
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser({ role: parsed.role, id: parsed._id });
      if (parsed.role === "admin") fetchUsers();
    }
  }, []);

  // api calls
  //fetch the users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) setUsers(await res.json());
      else toast.error("Failed to load users");
    } catch (error) { toast.error("Server connection error"); }
  };

  //role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { toast.success("Role updated!"); fetchUsers(); }
      else toast.error("Update failed.");
    } catch (error) { toast.error("Server Error"); }
  };

  // delete action
  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted!");
        setUsers(users.filter((u) => u._id !== userToDelete._id));
        setUserToDelete(null);
      } else toast.error("Failed to delete user.");
    } catch (error) { toast.error("Server Error"); }
  };

  if (currentUser.role !== "admin") return <div className="p-5 text-center">Access Denied</div>;

  return (
    //central container - wrapper - layout with flexbox
    <div className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`} id="wrapper"> 
      <Sidebar role={currentUser.role} activePage="/usersadmin" isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      
      <div id="page-content-wrapper" className="w-100 position-relative">
        <Navbar title="Users Management" />
        
        <div className="container-fluid p-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white py-3">
              <h5 className="mb-0 fw-bold">Registered Users ({users.length})</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="ps-4 fw-bold">{u.username} {u._id === currentUser.id && "(You)"}</td>
                        <td>{u.email}</td>
                        <td>
                          <select className="form-select form-select-sm" value={u.role} disabled={u._id === currentUser.id} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                            <option value="user">Salesperson</option>
                            <option value="store_manager"> Store Manager</option>
                            <option value="admin">Admin</option>
                            <option value="vendor">Vendor</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-outline-danger border-0" disabled={u._id === currentUser.id} onClick={() => setUserToDelete(u)}>
                            <img src="/icons/delete.png" alt="del" style={{ width: "20px" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* delete confirmation modal */}
          {userToDelete && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">Delete User</h5>
                    <button className="btn-close btn-close-white" onClick={() => setUserToDelete(null)}></button>
                  </div>
                  <div className="modal-body text-center">
                    <p>Delete <b>{userToDelete.username}</b>? This action is permanent.</p>
                    <button className="btn btn-secondary me-2" onClick={() => setUserToDelete(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={executeDelete}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersAdmin;