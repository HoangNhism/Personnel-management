const express = require('express');
const router = express.Router();
const AuthController = require("../controllers/authController");
const upload = require("../../config/multer"); // Import multer configuration

const authController = new AuthController();

router.post("/register", upload.single("avatar"), authController.register);
router.post('/login', authController.login);
router.post('/profile', authController.getUserProfile);

module.exports = router;