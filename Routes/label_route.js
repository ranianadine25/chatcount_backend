import express from "express";
import { addNewLabel, deleteLabel, getAllLabels, getAllLabelsbyRech, insertPredefinedLabels, insertPredefinedLabels2, insertPredefinedLabels3, insertPredefinedLabels4, insertPredefinedLabels5, updateLabel  } from "../Controllers/label_controller.js";

const router = express.Router();

router.post("/addLabel/:labelNumber",addNewLabel );


router.get("/getAllLabels/:labelNumber", getAllLabels);

router.get("/getAllLabels/:rootId/:label/:labelNumber", getAllLabelsbyRech);



router.patch("/updateLabel/:id/:labelNumber", updateLabel);



router.post("/insert",insertPredefinedLabels );
router.post("/insert2",insertPredefinedLabels2 );
router.post("/insert3",insertPredefinedLabels3 );
router.post("/insert4",insertPredefinedLabels4 );
router.post("/insert5",insertPredefinedLabels5 );

router.delete("/deleteLabel/:labelId/:labelNumber", deleteLabel);







export default router;