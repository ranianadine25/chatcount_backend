import express from "express";
import {
  deleteCsvData,
  exportCSVData,
  getcsvData,
  importCSVData,
  insertData,
  updateCsvData,
  updateCsvDataColonne,
} from "../Controllers/mot_cles_controller.js";
const router = express.Router();
router.route("/addTabMotClets").post(importCSVData);
router.route("/getCsvData").get(getcsvData);
router.route("/insertCsv").post(insertData);
router.route("/deleteCsv").delete(deleteCsvData);
router.route("/updateCsv").put(updateCsvData);
router.route("/addColumn").post(updateCsvDataColonne);
router.route("/export").get(exportCSVData);
export default router;
