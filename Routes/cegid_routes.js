import express from "express";
import { conectCegid } from "../Controllers/cegid_controller.js";


const router = express.Router();
router.route("/connectcegid").get(conectCegid)

export default router;
