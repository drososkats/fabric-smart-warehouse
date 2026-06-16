const router = require("express").Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const Notification = require("../models/Notification");

// multer configuration for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ensure 'uploads/' directory exists in the backend root
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // generate unique filename using timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// API ROUTES

// GET ALL: Retrieve all products from database
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE: Add a new product with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imgPath = req.file ? `uploads/${req.file.filename}` : "";

    const newProduct = new Product({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      imgUrl: imgPath,
    });

    const savedProduct = await newProduct.save();

    // trigger system notification for new entry
    await Notification.create({
      message: `New product added: ${savedProduct.name}`,
      type: "success",
    });

    res.status(200).json(savedProduct);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json(err);
  }
});

// DELETE: Remove product by ID
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (product) {
      // trigger system notification for deletion
      await Notification.create({
        message: `Product deleted: ${product.name}`,
        type: "danger",
      });
    }

    res.status(200).json("The product has been deleted.");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;