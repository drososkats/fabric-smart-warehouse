const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// REGISTER: Create a new user with hashed password and send a welcome email 
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || "user",
    });

    const user = await newUser.save();

    // --- ΣΕΝΑΡΙΟ: ΑΠΟΣΤΟΛΗ WELCOME EMAIL ---
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email", port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    let info = await transporter.sendMail({
      from: '"Fabric ERP" <system@fabric-erp.com>',
      to: user.email,
      subject: "Account Activation - Fabric ERP 🚀",
      html: `<h1>Welcome ${user.username}!</h1>
             <p>Thank you for joining Fabric ERP system.</p>
             <p>Your account is now active. You can log in using your email: <b>${user.email}</b></p>`
    });

    console.log("Welcome Email sent! Link:", nodemailer.getTestMessageUrl(info));
    // ---------------------------------------

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});
// LOGIN: Authenticate user and return JWT
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // compare hashed password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Wrong password" });

    // token generation - we can add it in .env file
    const JWT_SECRET = process.env.JWT_SEC || "mySuperSecretKey123";
    // print token with the attributes
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "3d" }
    );

    // strip password from response data
    const { password, ...others } = user._doc;
    //spread operator - take all data with token, and remove the password
    res.status(200).json({ ...others, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json(err);
  }
});

module.exports = router;