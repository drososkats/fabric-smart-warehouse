import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  // control state of product,roles
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState("user");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // initialization: user role and product data
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role || "user");

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        setProducts(await res.json());
      } catch (err) { console.error("fetch error", err); }
    };
    fetchProducts();
  }, []);

  // metrics calculations
  const totalProducts = products.length;
  const totalValue = products.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.stock)), 0).toFixed(2);
  const lowStock = products.filter(p => p.stock < 5).length;
  const healthyStock = totalProducts - lowStock;

  // chart configurations
  const stockHealthData = {
    labels: ["Healthy", "Low Stock"],
    datasets: [{ data: [healthyStock, lowStock], backgroundColor: ["#198754", "#dc3545"], borderWidth: 1 }]
  };

  const categories = [...new Set(products.map(p => p.category))];
  const categoryData = {
    labels: categories,
    datasets: [{ label: "Items", data: categories.map(c => products.filter(p => p.category === c).length), backgroundColor: "#0d6efd", borderRadius: 4 }]
  };

  const showFinancials = ["admin", "store_manager"].includes(role);

  return (
    <div className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`} id="wrapper">
      <Sidebar role={role} activePage="/dashboard" isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      
      <div id="page-content-wrapper" className="w-100 bg-light">
        <Navbar title="Dashboard Overview" />
        <div className="container-fluid p-4">
          
          {/* stats cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card h-100 p-3 text-bg-success shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title opacity-75 small">Total Products</h5>
                  <h2 className="fw-bold mb-0">{totalProducts}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 p-3 text-bg-danger shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title opacity-75 small">Low Stock Alerts</h5>
                  <h2 className="fw-bold mb-0">{lowStock}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              {showFinancials ? (
                <div className="card h-100 p-3 bg-white shadow-sm border-0 border-start border-primary border-4">
                  <div className="card-body">
                    <h5 className="card-title text-muted small">Total Asset Value</h5>
                    <h2 className="fw-bold mb-0 text-primary">€{totalValue}</h2>
                  </div>
                </div>
              ) : (
                <div className="card h-100 p-3 bg-white shadow-sm border-0 opacity-50 text-center d-flex justify-content-center">
                  <small className="fw-bold text-muted">Financials Restricted</small>
                </div>
              )}
            </div>
          </div>

          {/* charts section */}
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card h-100 shadow-sm border-0 p-3">
                <h6 className="fw-bold mb-3 small">Stock Health</h6>
                <div style={{height:"250px"}}><Doughnut data={stockHealthData} options={{maintainAspectRatio:false}} /></div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card h-100 shadow-sm border-0 p-3">
                <h6 className="fw-bold mb-3 small">Category Distribution</h6>
                <div style={{height:"250px"}}><Bar data={categoryData} options={{maintainAspectRatio:false, scales:{y:{beginAtZero:true}}}} /></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;