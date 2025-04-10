const authService = require('../../services/authService');

// Password validation helper
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');

  return errors;
};

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          message: "Registration failed",
          error: "Invalid email format",
        });
      }

      // Validate password
      const passwordErrors = validatePassword(userData.password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          message: "Registration failed",
          errors: passwordErrors,
        });
      }

      if (req.file) {
        userData.avatarURL = `/assets/avatar/${req.file.filename}`;
      }

      const user = await authService.register(userData);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      // Log detailed validation error
      if (error.name === "SequelizeValidationError") {
        const validationErrors = error.errors.map((err) => err.message);
        res.status(400).json({
          message: "User registration failed",
          errors: validationErrors,
        });
      } else {
        res
          .status(400)
          .json({ message: "User registration failed", error: error.message });
      }
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          message: "Login failed",
          error: "Email and password are required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Login failed",
          error: "Invalid email format",
        });
      }

      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          message: "Login failed",
          errors: passwordErrors,
        });
      }

      const { user, token } = await authService.login(email, password);
      res
        .status(200)
        .json({ message: "User logged in successfully", user, token });
    } catch (error) {
      res
        .status(400)
        .json({ message: "User login failed", error: error.message });
    }
  }

  async getUserProfile(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Failed to get user profile",
          error: "User not authenticated",
        });
      }

      const user = await authService.getUserProfile(req.user.id);
      if (!user) {
        return res.status(404).json({
          message: "Failed to get user profile",
          error: "User not found",
        });
      }

      res.status(200).json({ user });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to get user profile", error: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "Password change failed",
          error: "User ID is required",
        });
      }

      // Validate new password
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          message: "Password change failed",
          errors: passwordErrors,
        });
      }

      const user = await authService.changePassword(
        id,
        currentPassword,
        newPassword
      );
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      res
        .status(400)
        .json({ message: "Password change failed", error: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Password reset failed",
          error: "Email is required",
        });
      }

      const resetLink = await authService.generateResetToken(email);
      res.status(200).json({
        message: "Password reset link has been sent to your email",
        resetLink, // In production, you might want to remove this from the response
      });
    } catch (error) {
      res.status(400).json({
        message: "Password reset failed",
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          message: "Password reset failed",
          error: "Token and new password are required",
        });
      }

      // Validate new password
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          message: "Password reset failed",
          errors: passwordErrors,
        });
      }

      await authService.resetPassword(token, newPassword);
      res.status(200).json({
        message: "Password has been reset successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: "Password reset failed",
        error: error.message,
      });
    }
  }

  async validateResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          message: "Token validation failed",
          error: "Token is required"
        });
      }

      const isValid = await authService.validateResetToken(token);
      res.status(200).json({ valid: true });
    } catch (error) {
      res.status(400).json({
        message: "Token validation failed",
        error: error.message
      });
    }
  }
}

module.exports = AuthController;