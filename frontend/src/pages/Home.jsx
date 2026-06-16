import React, { useState } from "react";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import Typewriter from 'typewriter-effect';

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return toast.warning("Please enter an email address.");
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subscribed! Please check the console for the link.");
        console.log("Preview link:", data.preview);
        setEmail("");
      }
    } catch (err) { toast.error("server error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* hero section */}
      <header className="d-flex align-items-center text-center text-white" style={{
        background: `linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1170')`,
        backgroundSize: "cover", backgroundPosition: "center", height: "65vh"
      }}>
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">Fabric ERP System</h1>
          <div className="lead mb-5 opacity-75 mx-auto" style={{ maxWidth: "800px", minHeight: "3em" }}>
            <Typewriter
              options={{
                strings: ["The ultimate inventory management for fashion. Professional tools for growth.",],
                autoStart: true,
                loop: true,
                delay: 40,
                deleteSpeed: 30,
              }}
            />
         </div>
          <div className="d-flex gap-3 justify-content-center">
            <a href="/login" className="btn btn-primary btn-lg px-5 fw-bold">Login</a>
            <a href="/register" className="btn btn-outline-light btn-lg px-5 fw-bold">Get Started</a>
          </div>
        </div>
      </header>

      {/* features section */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="row text-center g-4">
            {[
              { icon: "inventory.png", title: "Smart Inventory", desc: "Real-time stock tracking and filtering." },
              { icon: "analytics.png", title: "Data Analytics", desc: "Visual charts and inventory distribution." },
              { icon: "report.png", title: "Instant Reports", desc: "Generate professional pdfs for accounting." }
            ].map((f, i) => (
              <div key={i} className="col-md-4">
                <div className="p-4 bg-white rounded shadow-sm h-100 border-0">
                  <img src={`/icons/${f.icon}`} alt={f.title} className="mb-3" style={{width:"64px"}} />
                  <h4 className="fw-bold">{f.title}</h4>
                  <p className="text-muted small">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* newsletter section */}
      <section className="py-5 bg-white">
        <div className="container text-center py-4">
          <div className="card border-0 shadow-lg p-5 mx-auto" style={{ maxWidth: "700px", borderRadius: "20px" }}>
            <h2 className="fw-bold mb-3">Stay Updated!</h2>
            <p className="text-muted mb-4 small">Receive the latest feature releases and demo activation emails.</p>
            <form onSubmit={handleSubscribe} className="d-flex gap-2 justify-content-center flex-wrap">
              <input type="email" className="form-control form-control-lg" placeholder="your@email.com" style={{maxWidth:"350px"}} value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="btn btn-dark btn-lg px-4 fw-bold" disabled={loading}>{loading ? "..." : "Subscribe"}</button>
            </form>
            <small className="text-muted mt-3 d-block fst-italic">* Demo simulation via ethereal mail.</small>
          </div>
        </div>
      </section>

      <footer className="bg-dark text-white py-4 mt-auto text-center small">
        &copy; 2026 Fabric ERP (Drosos Katsimpras). All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;