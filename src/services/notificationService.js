const Notification = require('../models/Notification');
const socketIO = require("../socket");

const notificationService = {
  createNotification: async (userId, type, message, link) => {
    try {
      const notification = new Notification({
        userId,
        type,
        message,
        link,
      });
      await notification.save();

      // Get socket instance and emit if available
      try {
        const io = socketIO.getIO();
        io.emit("notification", {
          userId: userId.toString(),
          notification,
        });
      } catch (socketError) {
        console.log("Socket notification failed:", socketError.message);
      }

      return notification;
    } catch (error) {
      console.error("Notification creation failed:", error);
      throw error;
    }
  },

  getNotificationsByUser: async (userId) => {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    return notifications;
  },

  markAsRead: async (notificationId) => {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    notification.isRead = true;
    await notification.save();
    return notification;
  },
};

module.exports = notificationService;