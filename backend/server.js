  /**
   * FABRIC ERP - CORE SERVER (NODE.JS / EXPRESS)
   */
  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const path = require("path");
  const fs = require("fs");
  const multer = require("multer");
  const jwt = require("jsonwebtoken");
  const nodemailer = require("nodemailer");
  require("dotenv").config();

  const { connectRabbitMQ, initMinIO, minioClient } = require('./cloud-services');

  //res - response (what return) | req - request (what is coming)
  // models & routes imports
  const authRoute = require("./routes/auth");
  const userRoute = require("./routes/users");
  const User = require("./models/User");
  const Product = require("./models/Product");
  const Notification = require("./models/Notification");

  //create an express object for your app (instance) - (manager of the server)
  const app = express();
  const PORT = process.env.PORT || 5000;
  const JWT_SECRET = process.env.JWT_SEC || "mySuperSecretKey123";

  // --- middlewares ---
  app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
  app.use(express.json());
  //dynamic pages (pdf reports)
  app.set("view engine", "ejs");
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // --- database connection ---
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Mongodb connected"))
    .catch(err => console.error("❌ Database error:", err));

  // --- file system & storage setup ---
  const dirs = ["uploads/product-images", "uploads/invoices"];
  dirs.forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = file.fieldname === "image" ? "uploads/product-images/" : "uploads/invoices/";
      cb(null, dest);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });
  const upload = multer({ storage });

  // --- api routes ---
  app.use("/api/auth", authRoute);
  app.use("/api/users", userRoute);

// newsletter service (simulated via ethereal)
app.post("/api/send-email", async (req, res) => {
  try {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();

    // Create a transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email", 
      port: 587, 
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Fabric ERP" <system@fabric-erp.com>', 
      to: req.body.email,
      subject: "Welcome to our Newsletter!", 
      html: "<b>Thank you for subscribing to Fabric ERP updates.</b>"
    });

    // Capture the preview URL from the info object
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Log the link to the backend terminal as requested
    console.log("Newsletter Subscription Request:");
    console.log("Preview Link:", previewUrl);

    // Send response back to frontend with the preview link
    return res.status(200).json({ message: "email sent", preview: previewUrl });
  } catch (err) { 
    console.error("Newsletter Error:", err);
    return res.status(500).json({ message: "email failed" }); 
  }
});
  // notifications system logic
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      let filter = {};
      if (userId) {
        const user = await User.findById(userId);
        if (user) filter = { createdAt: { $gte: user.createdAt } };
      }
      const notifications = await Notification.find(filter).sort({ createdAt: -1 });
      res.status(200).json(notifications);
    } catch (err) { res.status(500).json(err); }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.body.userId } });
      res.status(200).json("marked as read");
    } catch (err) { res.status(500).json(err); }
  });

  // --- product management (crud) ---
  app.get("/api/products", async (req, res) => {
    try { res.json(await Product.find()); } catch (err) { res.status(500).json(err); }
  });

app.post("/api/products", upload.fields([{ name: "image" }, { name: "invoice" }]), async (req, res) => {
  try {
    const bucket = process.env.MINIO_BUCKET;
    let imgUrl = "";
    let invUrl = "";

    // Ανέβασμα Εικόνας στο MinIO
    if (req.files["image"]) {
      const file = req.files["image"][0];
      const fileName = `img-${Date.now()}-${file.originalname}`;
      const VM_IP = process.env.VM_IP || "192.168.1.5";
      // Στέλνουμε το αρχείο από το path που το έσωσε το multer στο MinIO
      await minioClient.fPutObject(bucket, fileName, file.path);
      imgUrl = `http://${VM_IP}:9000/${bucket}/${fileName}`;
      fs.unlinkSync(file.path); // Καθαρίζουμε το τοπικό αρχείο
    }

    // Ανέβασμα Τιμολογίου (Invoice) στο MinIO
    if (req.files["invoice"]) {
      const file = req.files["invoice"][0];
      const fileName = `inv-${Date.now()}-${file.originalname}`;
      await minioClient.fPutObject(bucket, fileName, file.path);
      invUrl = `http://${VM_IP}:9000/${bucket}/${fileName}`;
      fs.unlinkSync(file.path);
    }

    // Αποθήκευση στη MongoDB με τα νέα Cloud URLs
    const saved = await new Product({ ...req.body, image: imgUrl, invoice: invUrl }).save();
    
    // Ειδοποίηση στον RabbitMQ
    const rabbitChannel = await connectRabbitMQ();
    if (rabbitChannel) {
        const msg = JSON.stringify({ event: "NEW_PRODUCT", name: saved.name });
        rabbitChannel.sendToQueue('system_logs', Buffer.from(msg));
    }

    res.status(201).json(saved);
  } catch (err) { 
    console.error(err);
    res.status(500).json("Error with Cloud Upload"); 
  }
});

  app.put("/api/products/:id", upload.fields([{ name: "image" }, { name: "invoice" }]), async (req, res) => {
    try {
      const old = await Product.findById(req.params.id);
      const img = req.files?.["image"] ? `/uploads/product-images/${req.files["image"][0].filename}` : old.image;
      const inv = req.files?.["invoice"] ? `/uploads/invoices/${req.files["invoice"][0].filename}` : old.invoice;
      const updated = await Product.findByIdAndUpdate(req.params.id, { ...req.body, image: img, invoice: inv }, { new: true });
      await Notification.create({ message: `✏️ Updated: ${updated.name}`, type: "info" });
      res.json(updated);
    } catch (err) { res.status(500).send("Update error"); }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const p = await Product.findByIdAndDelete(req.params.id);
      if (p) await Notification.create({ message: `Deleted: ${p.name}`, type: "danger" });
      res.status(200).send("deleted");
    } catch (err) { res.status(500).send("error"); }
  });

  app.get("/api/download", (req, res) => {
    const absPath = path.join(__dirname, req.query.file.startsWith("/") ? req.query.file.substring(1) : req.query.file);
    fs.existsSync(absPath) ? res.download(absPath) : res.status(404).send("File not found");
  });

  // secure report generation with ejs & jwt
  app.get("/report", async (req, res) => {
    const { token, role } = req.query;
    if (!token) return res.status(401).send('<h1 style="text-align:center;">Access Denied</h1>');
    try {
      jwt.verify(token, JWT_SECRET);
      const products = await Product.find({});
      const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0).toFixed(2);
      res.render("info", { products, totalValue, date: new Date().toLocaleDateString(), clientUrl: "http://localhost:3000/dashboard", role: role || "user" });
    } catch (err) { res.status(403).send('<h1 style="text-align:center;">Invalid Token</h1>'); }
  });


//start server function
const startServer = async () => {
  try {
    // define cloud services
    await initMinIO(); // minIO bucket
    const rabbitChannel = await connectRabbitMQ(); // connect RabbitMQ

    // start server
    app.listen(PORT, () => {
      console.log(`🚀 Fabric ERP is Cloud-Active on port ${PORT}`);
      
   // RabbitMQ message when start the server
      if (rabbitChannel) {
        const msg = JSON.stringify({ event: "SERVER_START", timestamp: new Date() });
        rabbitChannel.assertQueue('system_logs', { durable: false });
        rabbitChannel.sendToQueue('system_logs', Buffer.from(msg));
        console.log("Startup message sent to RabbitMQ (system_logs queue)");
      }
    });
  } catch (err) {
    console.error("❌ Failed to start the Cloud services:", err);
    process.exit(1); // Κλείνει το app αν αποτύχει η σύνδεση
  }
};

startServer();  
