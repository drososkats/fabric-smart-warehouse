const router = require("express").Router();
const Notification = require("../models/Notification");

// GET ALL: Fetch the 20 latest notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

// MARK ALL AS READ: Update isRead status for all documents
router.put("/mark-read", async (req, res) => {
  try {
    await Notification.updateMany({}, { $set: { isRead: true } });
    res.status(200).json("All notifications marked as read");
  } catch (err) {
    res.status(500).json(err);
  }
});

// MARK ONE AS READ: Add specific User ID to the readBy array
router.put("/:id/read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json("User ID is required");

    // Use $addToSet to ensure unique User IDs in the readBy array
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;