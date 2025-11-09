const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authenticate = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", authenticate, taskController.getAllTasks);
router.get("/my-tasks", authenticate, taskController.getMyTasks);
router.get("/:id", authenticate, taskController.getTaskById);
router.post("/", authenticate, taskController.createTask);
router.put("/:id", authenticate, taskController.updateTask);
router.delete("/:id", authenticate, taskController.deleteTask);
router.post("/:id/comments", authenticate, taskController.addComment);
router.get("/:id/comments", authenticate, taskController.getComments);
router.post(
  "/:id/attachments",
  authenticate,
  upload.single("file"),
  taskController.uploadAttachment
);

module.exports = router;
