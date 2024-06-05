import express from "express";
import {
  deletePatternData,
  exportCSVData,
  getpatternsData,
  importpatternsDatas,
  insertPatternData,
  updatePatternData,
} from "../Controllers/patterns_controllers.js";

const router = express.Router();
router.route("/addPaterns").post(importpatternsDatas);
router.route("/getpatterns").get(getpatternsData);
router.route("/insertligne").post(insertPatternData);
router.route("/deletePattern").delete(deletePatternData);
router.route("/updatePattern").put(updatePatternData);
router.route("/export").get(exportCSVData);

export default router;
