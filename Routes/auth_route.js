import express from "express";
import { body } from "express-validator";
import {
  getInvitedUser,
  inviteUser,
  inviteUsersToConversation,
  login,
  signUp,
  updateAvatar,
  updateUser,
  verifyInvitation,
} from "../Controllers/auth_controller.js";
import multerConfig from "../middlewares/multer-config.js";
import { authenticateToken } from "../middlewares/authentificateUser.js";
const router = express.Router();

router.route("/signup").post(multerConfig, signUp);
router.route("/login").post(login);
router.route("/updateprofil/:userId").post(multerConfig, updateUser);
router.route("/updateavatar/:userId").post(multerConfig, updateAvatar);
router.post("/invite", inviteUser);
router.get("/verify-invitation", verifyInvitation);
router.get("/getInvitedUser/:inviterId", getInvitedUser);
router.post("/invite-users", inviteUsersToConversation);

export default router;
