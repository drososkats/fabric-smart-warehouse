import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  const CATEGORIES = ["T-shirt/top", "Trouser", "Pullover", "Dress", "Coat", "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot"];

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setRole(JSON.parse(stored).role || "user");
  }, []);

  // handlers for files
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); setError(null); }
  };

  const handleDiscard = (showToast = true) => {
    setError(null);
    if (showToast && !name && !category && !price && !stock && !imageFile && !invoiceFile) return toast.warning("Form is already empty");
    
    setName(""); setCategory(""); setPrice(""); setStock("");
    setImageFile(null); setPreview(null); setInvoiceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
    if (showToast) toast.success("Form cleared");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !price || !stock || !imageFile) {
      setError("All required fields must be filled");
      return window.scrollTo(0, 0);
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("image", imageFile);
    if (invoiceFile) formData.append("invoice", invoiceFile);

    try {
      const res = await fetch(`${API_URL}/api/products`, { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Product added successfully!");
        navigate("/inventory");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add product");
      }
    } catch (err) { setError("Server error occurred"); }
  };

  return (
    <div className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`} id="wrapper">
      <Sidebar role={role} activePage="/add-product" isExpanded={isSidebarExpanded} toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      
      <div id="page-content-wrapper" className="w-100">
        <Navbar title="Add New Product" />
        <div className="container-fluid p-4">
          <div className="row justify-content-center"><div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-success text-white py-3"><h4 className="mb-0 fw-bold">Product Details</h4></div>
              <div className="card-body p-4">
                {error && <div className="alert alert-danger fw-bold small border-start border-5 border-danger">{error}</div>}
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Name</label>
                    <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fabric" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Category</label>
                    <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Image <span className="text-danger">*</span></label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
                    {preview && <div className="mt-2 text-center"><img src={preview} style={{ maxHeight: "150px", borderRadius: "8px" }} alt="preview" /></div>}
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Invoice (Optional)</label>
                    <input type="file" className="form-control" accept=".pdf, .jpg, .jpeg, .png" onChange={e => setInvoiceFile(e.target.files[0])} ref={invoiceInputRef} />
                  </div>
                  <div className="row g-3">
                    <div className="col-6"><label className="form-label fw-bold">Price (€)</label>
                      <input type="number" className="form-control" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
                    </div>
                    <div className="col-6"><label className="form-label fw-bold">Stock</label>
                      <input type="number" className="form-control" value={stock} onChange={e => setStock(e.target.value)} min="0" />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mt-4 gap-3">
                    <button type="button" className="btn btn-secondary py-2 fw-bold flex-grow-1" onClick={() => handleDiscard()}>Discard</button>
                    <button type="submit" className="btn btn-success py-2 fw-bold flex-grow-1">Save Product</button>
                  </div>
                </form>
              </div>
            </div>
          </div></div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;