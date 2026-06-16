import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { API_URL } from "../config";

const Inventory = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState("user");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // SEARCH & FILTER STATE (NEW)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modals State
  const [editingProduct, setEditingProduct] = useState(null);
  const [originalProduct, setOriginalProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Preview Modals
  const [previewImage, setPreviewImage] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const [error, setError] = useState("");

  // --- CONSTANTS (Categories for Filter) ---
  const CATEGORIES = [
    "T-shirt/top",
    "Trouser",
    "Pullover",
    "Dress",
    "Coat",
    "Sandal",
    "Shirt",
    "Sneaker",
    "Bag",
    "Ankle boot",
  ];

  // --- INITIALIZATION ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setRole(parsedUser.role || "user");
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      console.log("Products from DB:", data);
      setProducts(data);
    } catch (error) {
      toast.error("Error fetching products");
    }
  };

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  // --- FILTER LOGIC (NEW) ---
  // Αυτή η μεταβλητή περιέχει ΜΟΝΟ τα προϊόντα που ταιριάζουν στην αναζήτηση
  const filteredProducts = products.filter((product) => {
    // 1. Έλεγχος Ονόματος (Case insensitive)
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // 2. Έλεγχος Κατηγορίας
    const matchesCategory =
      filterCategory === "" || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // ==========================
  //      DELETE HANDLERS
  // ==========================
  const executeDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/products/${productToDelete._id}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        setProducts(products.filter((p) => p._id !== productToDelete._id));
        toast.success("Product deleted successfully!");
        setProductToDelete(null);
      } else {
        toast.error("Failed to delete product.");
      }
    } catch (error) {
      toast.error("Server error while deleting.");
    }
  };

  // ==========================
  //       EDIT HANDLERS
  // ==========================
  const handleEditClick = (product) => {
    if (role === "vendor") return;
    setError("");
    setEditingProduct(product);
    setOriginalProduct(product);
  };

  const handleInputChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSaveChanges = async () => {
    if (editingProduct.price < 0 || editingProduct.stock < 0) {
      setError("Price and Stock cannot be negative.");
      return;
    }

    const hasChanges =
      editingProduct.name !== originalProduct.name ||
      String(editingProduct.price) !== String(originalProduct.price) ||
      String(editingProduct.stock) !== String(originalProduct.stock) ||
      editingProduct.imageFile ||
      editingProduct.invoiceFile;

    if (!hasChanges) {
      setError("No changes have been made.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editingProduct.name);
      formData.append("category", editingProduct.category);
      formData.append("price", editingProduct.price);
      formData.append("stock", editingProduct.stock);

      if (editingProduct.imageFile) {
        formData.append("image", editingProduct.imageFile);
      }
      if (editingProduct.invoiceFile) {
        formData.append("invoice", editingProduct.invoiceFile);
      }

      const response = await fetch(
        `${API_URL}/api/products/${editingProduct._id}`,
        { method: "PUT", body: formData },
      );

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(
          products.map((p) =>
            p._id === updatedProduct._id ? updatedProduct : p,
          ),
        );
        toast.success("Product updated successfully!");
        setEditingProduct(null);
      } else {
        toast.error("Failed to update product.");
      }
    } catch (error) {
      toast.error("Server error while updating.");
    }
  };

  const handleDownloadInvoice = (fileUrl) => {
    window.location.href = `${API_URL}/api/download?file=${fileUrl}`;
  };

  const canManage = role === "admin" || role === "store_manager";

  return (
    <div
      className={`d-flex ${!isSidebarExpanded ? "toggled" : ""}`}
      id="wrapper"
    >
      <Sidebar
        role={role}
        activePage="/inventory"
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
      />

      <div id="page-content-wrapper" className="w-100 position-relative">
        <Navbar title="Inventory List" />

        <div className="container-fluid p-4">
          {/* --- SEARCH & FILTER BAR (NEW) --- */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="row g-3">
                {/* Search Input */}
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <img
                        src="/icons/search.png"
                        alt="search"
                        style={{ width: "16px", opacity: 0.5 }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      {/* Αν δεν έχεις search icon, βάλε απλά 🔍 */}
                      {!document.querySelector(
                        'img[src="/icons/search.png"]',
                      ) && <span style={{ opacity: 0.5 }}>🔍</span>}
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search product name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Button */}
                <div className="col-md-2 d-grid">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCategory("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            {/* TABLE HEADER */}
            <div className="card-header bg-success text-white border-0 py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <img
                  src="/icons/box.png"
                  alt="box"
                  style={{
                    width: "24px",
                    filter: "brightness(0) invert(1)",
                    marginRight: "10px",
                  }}
                />
                <h5 className="mb-0 fw-bold">Current Stock</h5>
              </div>
              <span className="badge bg-white text-success border border-white">
                Showing: {filteredProducts.length} Items{" "}
                {/* Δείχνει πόσα βρήκε */}
              </span>
            </div>

            {/* TABLE BODY */}
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="text-center">
                      <th className="ps-4">Image</th>
                      <th className="text-start">Product Name</th>
                      <th>Category</th>
                      {role !== "vendor" && <th>Price</th>}
                      <th>Stock Level</th>
                      <th>Docs</th>
                      <th>Status</th>
                      {canManage && <th className="text-end pe-4">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {/* ΠΡΟΣΟΧΗ: Εδώ κάνουμε map στο filteredProducts αντί για το products */}
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr
                          key={product._id}
                          className="text-center"
                          style={{ cursor: "default" }}
                        >
                          <td
                            className="ps-4"
                            style={{ width: "80px", verticalAlign: "middle" }}
                          >
                            {product.image ? (
                              <div
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  border: "1px solid #dee2e6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#fff",
                                  cursor: "zoom-in",
                                  margin: "0 auto",
                                }}
                                onClick={() =>
                                  setPreviewImage(`${API_URL}${product.image}`)
                                }
                              >
                                <img
                                  src={`${API_URL}${product.image}`}
                                  alt="prod"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerText = "No Img";
                                    e.target.parentElement.style.fontSize =
                                      "10px";
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>

                          <td className="fw-bold text-start">{product.name}</td>
                          <td>{product.category}</td>
                          {role !== "vendor" && <td>{product.price} €</td>}

                          <td
                            className={
                              product.stock < 5
                                ? "text-danger fw-bold"
                                : "text-success fw-bold"
                            }
                          >
                            {product.stock}
                          </td>

                          <td>
                            {product.invoice ? (
                              <button
                                className="btn btn-sm btn-light border"
                                title="View Invoice"
                                onClick={() =>
                                  setPreviewInvoice(product.invoice)
                                }
                              >
                                <img
                                  src="/icons/invoice.png"
                                  alt="PDF"
                                  style={{ width: "20px" }}
                                />
                              </button>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>

                          <td>
                            {product.stock < 5 ? (
                              <span className="badge bg-danger">Low Stock</span>
                            ) : (
                              <span className="badge bg-success">In Stock</span>
                            )}
                          </td>

                          {canManage && (
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-outline-primary border-0"
                                  onClick={() => handleEditClick(product)}
                                  title="Edit Product"
                                >
                                  <img
                                    src="/icons/edit.png"
                                    alt="Edit"
                                    style={{ width: "20px" }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.parentElement.innerText = "Edit";
                                    }}
                                  />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger border-0"
                                  onClick={() => setProductToDelete(product)}
                                  title="Delete Product"
                                >
                                  <img
                                    src="/icons/delete.png"
                                    alt="Delete"
                                    style={{ width: "20px" }}
                                  />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      // Μήνυμα όταν δεν βρίσκει τίποτα η αναζήτηση
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          <h5 className="mt-2">No products found</h5>
                          <p className="small">
                            Try adjusting your search or filters.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- MODALS (Edit, Delete, Preview) παραμένουν ίδια --- */}
        {editingProduct && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">Edit Product</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setEditingProduct(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Product Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={editingProduct.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    {/* ... Rest inputs ... */}
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label fw-bold">Price (€)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="price"
                          value={editingProduct.price}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label fw-bold">Stock</label>
                        <input
                          type="number"
                          className="form-control"
                          name="stock"
                          value={editingProduct.stock}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Change Image</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            imageFile: e.target.files[0],
                          })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Update Invoice
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf, .jpg, .png"
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            invoiceFile: e.target.files[0],
                          })
                        }
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {productToDelete && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Delete product?</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setProductToDelete(null)}
                  ></button>
                </div>
                <div className="modal-body text-center p-4">
                  <p>
                    Are you sure you want to delete{" "}
                    <b>{productToDelete.name}</b>?
                  </p>
                  <div className="mt-3">
                    <button
                      className="btn btn-secondary me-2"
                      onClick={() => setProductToDelete(null)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-danger" onClick={executeDelete}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1070 }}
            onClick={() => setPreviewImage(null)}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content bg-transparent border-0">
                <div className="modal-body text-center position-relative">
                  <button
                    type="button"
                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                    onClick={() => setPreviewImage(null)}
                  ></button>
                  <img
                    src={previewImage}
                    alt="Full Size"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "80vh",
                      borderRadius: "10px",
                      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {previewInvoice && (
          <div
            className="modal d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow" style={{ height: "85vh" }}>
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title">Invoice Preview</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setPreviewInvoice(null)}
                  ></button>
                </div>
                <div className="modal-body p-0 bg-light d-flex flex-column">
                  <iframe
                    src={`${API_URL}${previewInvoice}`}
                    title="Invoice"
                    style={{ width: "100%", flex: 1, border: "none" }}
                  ></iframe>
                </div>
                <div className="modal-footer bg-white">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPreviewInvoice(null)}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(previewInvoice)}
                    className="btn btn-success d-flex align-items-center"
                  >
                    <img
                      src="/icons/invoice.png"
                      alt=""
                      style={{
                        width: "20px",
                        filter: "brightness(0) invert(1)",
                        marginRight: "8px",
                      }}
                    />
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
