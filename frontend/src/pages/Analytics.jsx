import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Analytics = () => {
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState("user");
  const [activeTab, setActiveTab] = useState("operational");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // initialization: load user and products
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role || "user");
    fetch(`${API_URL}/api/products`).then(res => res.json()).then(data => setProducts(data)).catch(err => console.error(err));
  }, []);

  const isManagement = ["admin", "store_manager"].includes(role);

  // financial data: value per category
  const categories = [...new Set(products.map(p => p.category))];
  const valuePerCategory = categories.map(cat => 
    products.filter(p => p.category === cat).reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0)
  );

  // operational data: top 5 products by stock volume
  const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
  
  const operationalChartData = {
    labels: topProducts.map(p => p.name),
    datasets: [{ label: "Units in Stock", data: topProducts.map(p => p.stock), backgroundColor: "rgba(54, 162, 235, 0.7)", borderRadius: 4 }]
  };

  const financialChartData = {
    labels: categories,
    datasets: [{ label: "Total Asset Value (€)", data: valuePerCategory, backgroundColor: "#198754", borderRadius: 5 }]
  };

  const operationalOptions = { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };
  const genericOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } };

  return (
    <div className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`} id="wrapper">
      <Sidebar role={role} activePage="/analytics" isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      
      <div id="page-content-wrapper" className="w-100 bg-light">
        <Navbar title="Analytics Dashboard" />
        <div className="container-fluid p-4">
          
          {/* navigation tabs */}
          <div className="d-flex justify-content-center mb-4">
            <div className="btn-group shadow-sm bg-white rounded p-1">
              <button className={`btn px-4 fw-bold ${activeTab === "operational" ? "btn-primary" : "btn-light text-muted"}`} onClick={() => setActiveTab("operational")}>
                <img src="/icons/operational.png" alt="ops" style={{width:"20px", marginRight:"8px"}} /> Operational
              </button>
              {isManagement && (
                <button className={`btn px-4 fw-bold ${activeTab === "financial" ? "btn-success" : "btn-light text-muted"}`} onClick={() => setActiveTab("financial")}>
                  <img src="/icons/financial.png" alt="fin" style={{width:"20px", marginRight:"8px"}} /> Financial
                </button>
              )}
            </div>
          </div>

          {/* dynamic chart card */}
          <div className="row justify-content-center"><div className="col-lg-10">
            <div className="card shadow-sm border-0">
              <div className={`card-header text-white py-3 border-0 ${activeTab === "operational" ? "bg-primary" : "bg-success"}`}>
                <h5 className="mb-0 fw-bold">{activeTab === "operational" ? "Top 5 Products by Stock Volume" : "Asset Value Analysis"}</h5>
                <small className="opacity-75">{activeTab === "operational" ? "inventory volume per item" : "monetary value per category"}</small>
              </div>
              <div className="card-body p-4" style={{ height: "450px" }}>
                {products.length > 0 ? (
                  activeTab === "operational" ? 
                  <Bar data={operationalChartData} options={operationalOptions} /> : 
                  <Bar data={financialChartData} options={genericOptions} />
                ) : <p className="text-center mt-5">no data available</p>}
              </div>
            </div>
          </div></div>

        </div>
      </div>
    </div>
  );
};

export default Analytics;