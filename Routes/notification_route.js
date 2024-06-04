import express from "express";
import {
  getNotifications,
  markAsRead,
} from "../Controllers/notification_controller.js";
const router = express.Router();

router.get("/getNotifications", getNotifications);
router.put("/markAsRead/:senderId", markAsRead);

export default router;
