const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const User = require("../models/User");
const { sendAccountCreatedEmail } = require("./emailService");
const leaveService = require("./leaveService");
require("dotenv").config();
const { JWT_SECRET, FRONTEND_URL } = process.env;

const authService = {
  register: async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({ ...userData, password: hashedPassword });

    // Khởi tạo số ngày nghỉ phép cho user mới
    await leaveService.initializeLeaveBalance(user.id);

    return user;
  },

  login: async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return { user, token };
  },

  validateToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  },

  getUserRole: (user) => {
    return user.role;
  },

  generateResetToken: async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetPasswordLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendAccountCreatedEmail(user.email, resetPasswordLink);

    return resetPasswordLink;
  },

  resetPassword: async (token, newPassword) => {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return user;
  },

  validateResetToken: async (token) => {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    return true;
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  },
};

module.exports = authService;
