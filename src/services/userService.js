const { Sequelize } = require("sequelize"); // Import Sequelize
const User = require("../models/User");
const EmployeeDocument = require("../models/EmployeeDocument");

const CDN_URL = "http://localhost:4000";

const userService = {
  createUser: async (userData) => {
    const user = await User.create(userData);
    return user;
  },

  getAllUsers: async () => {
    const users = await User.findAll({
      where: {
        status: "Active",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No active users found");
    }
    return users;
  },

  getUserById: async (id) => {
    const user = await User.findOne({
      where: {
        id,
        status: "Active",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  getUserByName: async (name) => {
    const user = await User.findOne({
      where: {
        name,
        status: "Active",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  getUserByEmail: async (email) => {
    const user = await User.findOne({
      where: {
        email,
        status: "Active",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  getUserByRole: async (role) => {
    const users = await User.findAll({
      where: {
        role,
        status: "Active",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No active users found with the specified role");
    }
    return users;
  },

  getUserByStatus: async (status) => {
    const users = await User.findAll({ where: { status } });
    if (users.length === 0) {
      throw new Error("No users found with the specified status");
    }
    return users;
  },

  getUserByDepartment: async (department) => {
    const users = await User.findAll({
      where: {
        department,
        status: "Active",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No active users found in the specified department");
    }
    return users;
  },

  getUserByPosition: async (position) => {
    const users = await User.findAll({
      where: {
        position,
        status: "Active",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No active users found with the specified position");
    }
    return users;
  },

  getUserByMultipleFields: async (fields) => {
    const users = await User.findAll({
      where: {
        ...fields,
        status: "Active",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No active users found with the specified fields");
    }
    return users;
  },

  updateUser: async (id, userData) => {
    const user = await User.findOne({
      where: {
        id,
        status: "Active",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    Object.assign(user, userData);
    await user.save();
    return user;
  },

  deleteUser: async (id) => {
    const user = await User.findOne({
      where: {
        id,
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    user.isDelete = true;
    await user.save();
    return user;
  },

  uploadFile: async (userId, file) => {
    // Ensure userId is a string of length 16
    if (typeof userId !== "string" || userId.length !== 16) {
      throw new Error("Invalid userId");
    }

    const fileData = {
      employeeId: userId, // Use userId as a string
      fileName: file.originalname,
      fileUrl: file.path, // Assuming the file path is stored here
      fileType: file.mimetype.split("/")[1],
    };
    const uploadedFile = await EmployeeDocument.create(fileData);
    return uploadedFile;
  },

  blockUser: async (id) => {
    const user = await User.findOne({
      where: {
        id,
        status: "Active",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    user.status = "Inactive";
    await user.save();
    return user;
  },

  getBlockedUsers: async () => {
    const users = await User.findAll({
      where: {
        status: "Inactive",
        isDelete: false,
      },
    });
    if (users.length === 0) {
      throw new Error("No blocked users found");
    }
    return users;
  },

  unblockUser: async (id) => {
    const user = await User.findOne({
      where: {
        id,
        status: "Inactive",
        isDelete: false,
      },
    });
    if (!user) {
      throw new Error("Blocked user not found");
    }
    user.status = "Active";
    await user.save();
    return user;
  },

  getUserFiles: async (userId) => {
    const response = await fetch(`${CDN_URL}/documents/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch user files from CDN");
    }
    return await response.json();
  },
};

module.exports = userService;
