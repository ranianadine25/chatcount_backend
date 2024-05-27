import express from "express";
import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  uploadFec,
  replaceFile,
  getFec,
  recupFolderName,
  deleteFec,
  lancerTraitement,
  getFecbyState,
} from "../Controllers/dossier_controller.js";
import upload from "../middlewares/multer-fec.js";

const router = express.Router();

router.post("/create", createFolder);
router.get("/:userId", getFolders);
router.get("/:userId/:folderId", getFolderById);
router.put("/:folderId", updateFolder);
router.delete("/:folderId", deleteFolder);
router.post("/upload/:userId/:folderId", upload, uploadFec); // Endpoint pour télécharger un nouveau FEC dans un dossier spécifié
router.put("/:userId/:folderId/:existingFecId/replace", replaceFile); // Endpoint pour remplacer un FEC existant dans un dossier spécifié
router.get("/:userId/:folderId/fec", getFec);
router.get("/filter/:userId/:folderId/:etat", getFecbyState);

router.get("/getFecName/:folderId", recupFolderName);
router.delete("/deleteFec/:fecId", deleteFec);
router.post("/traiter/:fecId", lancerTraitement);

export default router;
