import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../config";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "user" });

  // handle input changes
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // simple client-side validation
    if (formData.password.length < 8) return toast.error("Password must be at least 8 characters.");

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful! Please login.");
        navigate("/");
      } else {
        toast.error(data.message || "Registration failed !");
      }
    } catch (err) { toast.error("connection error"); }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light p-3">
      <div className="card shadow-lg border-0 overflow-hidden" style={{ maxWidth: "900px", width: "100%", borderRadius: "15px" }}>
        <div className="row g-0">
          {/* visual side */}
          <div className="col-md-6 d-none d-md-block">
            <img src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1170" alt="fabric" className="img-fluid h-100 w-100 object-fit-cover" />
          </div>
          {/* form side */}
          <div className="col-md-6 bg-white p-4 p-md-5">
            <h3 className="fw-bold text-center">Join Fabric ERP</h3>
            <p className="text-muted text-center mb-4">Create your account</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">USERNAME</label>
                <input type="text" name="username" className="form-control bg-light border-0" value={formData.username} onChange={handleChange} required placeholder="Drosos Katsimpras"/>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">EMAIL</label>
                <input type="email" name="email" className="form-control bg-light border-0" value={formData.email} onChange={handleChange} required placeholder="name@example.com"/>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">PASSWORD</label>
                <input type="password" name="password" className="form-control bg-light border-0" value={formData.password} onChange={handleChange} required placeholder="••••••••"/>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">ROLE</label>
                <select name="role" className="form-select bg-light border-0" value={formData.role} onChange={handleChange}>
                  <option value="user">Salesperson</option>
                  <option value="vendor">Vendor</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn btn-dark w-100 fw-bold mb-3">REGISTER</button>
              <div className="text-center small">
                <span className="text-muted">Already have an account? </span>
                <Link to="/" className="text-decoration-none fw-bold text-dark">Login here</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;