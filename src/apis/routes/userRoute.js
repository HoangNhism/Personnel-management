const express = require('express'); 
const multer = require('multer');
const router = express.Router();
const path = require("path");
const UserController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const upload = multer({ dest: "uploads/" }); // Configure multer for file uploads



const userController = new UserController();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUsers
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Account"]),
  userController.getUserById
);
router.get(
  "/email/:email",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByEmail
);
router.get(
  "/role/:role",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByRole
);
router.get(
  "/status/:status",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByStatus
);
router.get(
  "/department/:department",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByDepartment
);
router.get(
  "/position/:position",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByPosition
);
router.get(
  "/fields",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  userController.getUserByMultipleFields
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Account"]),
  userController.updateUser
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.deleteUser
);
router.post(
  "/:id/upload",
  authMiddleware,
  roleMiddleware(["Admin", "Manager"]),
  upload.single("file"), // Ensure the field name is "file"
  userController.uploadUserFile
);
router.put(
  "/:id/block",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.blockUser
);

router.get(
  "/blocked/all",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.getBlockedUsers
);

router.put(
  "/:id/unblock",
  authMiddleware,
  roleMiddleware(["Admin"]),
  userController.unblockUser
);

router.get(
  "/:id/notifications",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Account"]),
  userController.getNotificationsByUser
);

router.get(
  "/:id/files",
  authMiddleware,
  roleMiddleware(["Admin", "Manager", "Employee", "Account"]),
  userController.getUserFiles
);

router.post("/request-password-reset", userController.requestPasswordReset);

router.post("/reset-password", userController.resetPassword);

module.exports = router;