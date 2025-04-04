const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendAccountCreatedEmail } = require("./emailService");
const leaveService = require("./leaveService");
require("dotenv").config();
const { JWT_SECRET, FRONTEND_URL } = process.env;

const authService = {
  register: async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({ ...userData, password: hashedPassword });

    // Generate reset password link
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetPasswordLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // // Khởi tạo số ngày nghỉ phép cho user mới
    await leaveService.initializeLeaveBalance(user.id);

    // Send reset password email
    await sendAccountCreatedEmail(user.email, resetPasswordLink);

    return user;
  },

  login: async (email, password) => {
    // const hardcodedAdmin = {
    //   email: "admin@gmail.com",
    //   password: "123",
    //   role: "Admin",
    // };
    // if (email === hardcodedAdmin.email) {
    //   if (password === hardcodedAdmin.password) {
    //     const token = jwt.sign(
    //       { email: hardcodedAdmin.email, role: hardcodedAdmin.role },
    //       JWT_SECRET,
    //       { expiresIn: "1h" }
    //     );
    //     return { user: hardcodedAdmin, token };
    //   } else {
    //     throw new Error("Invalid password");
    //   }
    // }

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

  resetPassword: async (token, newPassword) => {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return user;
  },
};

module.exports = authService;
