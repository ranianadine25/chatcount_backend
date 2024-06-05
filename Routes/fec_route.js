// fecRoute.js

import express from "express";
import {
  deleteFec,
  getFec,
  replaceFile,
  uploadFec,
} from "../Controllers/fec_controller.js";
import upload from "../middlewares/multer-fec.js";
import { recupFecId, recupFecName } from "../Controllers/conversation_controller.js";

const router = express.Router();

router.post("/uploadCsv/:userId", upload, uploadFec);
router.get("/getCsv/:userId", getFec);
router.put("/fec/replace/:existingFecId", replaceFile);
router.get("/getFecName/:conversationId", recupFecName);
router.get("/getFecId/:conversationId", recupFecId);

router.delete("/deletefec/:fecId", deleteFec);

export default router;
