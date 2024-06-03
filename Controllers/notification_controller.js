import Notification from "../Models/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("sender", "name avatar")
      .exec();

    const results = notifications.map((notification) => ({
      creation_date: notification.creation_date,
      message: notification.message,
      sender: notification.sender
        ? {
            // Vérifiez si sender est défini
            name: notification.sender.name,
            avatar: notification.sender.avatar,
          }
        : null,
      seen: notification.seen,
    }));

    res.status(200).send(results);
  } catch (err) {
    console.error("Failed to get notifications:", err);
    res.status(500).send("Failed to get notifications");
  }
};
export const markAsRead = async (req, res) => {
    try {
        console.log("hello notification");
        const senderId = req.params.senderId; 
        const filter = { sender: senderId };
        const update = { $set: { seen: true } };  // Ensure the update object is correct

        const updatedNotifications = await Notification.updateMany(filter, update);
        console.log("sender", senderId);
        console.log("notifications updated:", updatedNotifications);
        res.status(200).json(updatedNotifications);
    } catch (error) {
        console.error("Failed to update notifications:", error);
        res.status(500).json({ message: "Failed to update notifications" });
    }
};

