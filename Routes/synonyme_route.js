import express from "express";
import {
  deleteCsvData,
  exportCSVData,
  getcsvData,
  importCSVData,
  insertData,
  updateCsvData,
  updateCsvDataColonne,
  updateTitleData,
} from "../Controllers/synnyme_controller.js";
const router = express.Router();
router.route("/addTabSynonyme").post(importCSVData);
router.route("/getSynonymeData").get(getcsvData);
router.route("/insertSynonyme").post(insertData);
router.route("/deleteSynonyme").delete(deleteCsvData);
router.route("/updateSynonyme").put(updateCsvData);
router.route("/updattitldata").put(updateTitleData);
router.route("/addColumn").post(updateCsvDataColonne);
router.route("/export").get(exportCSVData);
export default router;
