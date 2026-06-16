import React, { useState } from "react";
import { API_URL } from "../config";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        // save user data and token to localstorage
        localStorage.setItem("user", JSON.stringify(data));
        // force reload to dashboard to initialize all states
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) { toast.error("Server connection error"); }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light p-3">
      <div className="card shadow-lg border-0 overflow-hidden" style={{ maxWidth: "900px", width: "100%", borderRadius: "15px" }}>
        <div className="row g-0">
          {/* image side */}
          <div className="col-md-6 d-none d-md-block">
            <img src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1170" alt="fabric" className="img-fluid h-100 w-100 object-fit-cover" />
          </div>
          {/* form side */}
          <div className="col-md-6 bg-white p-4 p-md-5">
            <h3 className="fw-bold text-center">Welcome Back</h3>
            <p className="text-muted text-center mb-4 small">Please login to your account</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted text-uppercase">Email</label>
                <input type="email" className="form-control bg-light border-0" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase">Password</label>
                <input type="password" className="form-control bg-light border-0" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-dark w-100 fw-bold mb-3">LOGIN</button>
              <div className="text-center small">
                <a href="/" className="text-decoration-none text-muted me-2">Back to Home</a>
                <span className="text-muted">|</span>
                <a href="/register" className="text-decoration-none fw-bold text-dark ms-2">Create Account</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;