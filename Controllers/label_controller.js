import label1 from "../Models/label1.js";
import label2 from "../Models/label2.js";
import Label3 from "../Models/label3.js";
import Label4 from "../Models/label4.js";
import Label5 from "../Models/label5.js";
import { Types } from 'mongoose';
const { ObjectId } = Types;

import {sendMissionNotification} from "./dossier_controller.js";
import {
  racineLibelle1Mapping,
  racineLibelle2Mapping,
  racineLibelle3Mapping,
  racineLibelle4Mapping,
  racineLibelle5Mapping,
} from "../Models/mapping.js";


export async function getAllLabels(req, res) {
  const labelNumber = req.params.labelNumber;
  try {
    let labels;
    switch (labelNumber) {
      case "1":
        labels = await label1.find({});
        break;
      case "2":
        labels = await label2.find({});
        break;
      case "3":
        labels = await Label3.find({});
        break;
      case "4":
        labels = await Label4.find({});
        break;
      case "5":
        labels = await Label5.find({});
        break;
      default:
        return res.status(400).json({ message: "Invalid label number" });
    }
    res.json(labels);
  } catch (error) {
    console.error("Erreur lors de la récupération des libellés :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des libellés" });
  }
}
export async function getAllLabelsbyRech(req, res) {
  const labelNumber = req.params.labelNumber;
  const { rootId, label } = req.params;
  
  try {
    let query = {};
    
    if (rootId) {
      query.rootId = rootId;
    }
    if (label) {
      query.label = label;
    }
    
    if (Object.keys(query).length === 0) {
      let labels;
      switch (labelNumber) {
        case "1":
          labels = await label1.find({});
          break;
        case "2":
          labels = await label2.find({});
          break;
        case "3":
          labels = await Label3.find({});
          break;
        case "4":
          labels = await Label4.find({});
          break;
        case "5":
          labels = await Label5.find({});
          break;
        default:
          return res.status(400).json({ message: "Invalid label number" });
      }
      res.json(labels);
    } else {
      // Si des paramètres de recherche sont fournis, utilisez-les pour filtrer les résultats
      let labels;
      switch (labelNumber) {
        case "1":
          labels = await label1.find(query);
          break;
        case "2":
          labels = await label2.find(query);
          break;
        case "3":
          labels = await Label3.find(query);
          break;
        case "4":
          labels = await Label4.find(query);
          break;
        case "5":
          labels = await Label5.find(query);
          break;
        default:
          return res.status(400).json({ message: "Invalid label number" });
      }
      res.json(labels);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des libellés :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des libellés" });
  }
} 
export async function addNewLabel(req, res) {
  const userId = req.body.userId;
  const labelData = req.body;
  const labelNumber = req.params.labelNumber; 
  const systemUser = {
    _id: new ObjectId('60d0fe4f5311236168a109ca'), 
    name: 'système',
    email: 'system@domain.com' 
  };
  try {
    let LabelModel;
    switch (labelNumber) {
      case "1":
        LabelModel = label1;
        break;
      case "2":
        LabelModel = label2;
        break;
      case "3":
        LabelModel = Label3;
        break;
      case "4":
        LabelModel = Label4;
        break;
      case "5":
        LabelModel = Label5;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid label number" });
    }

    const existingLabel = await LabelModel.findOne({ rootId: labelData.rootId });

    if (existingLabel) {
      return res.status(409).json({
        success: false,
        message: `La racine ${labelData.rootId} existe déjà.`,
      });
    }

    const newLabel = new LabelModel(labelData);
    await newLabel.save();
   await sendMissionNotification("Un nouveau libellé est ajouté avec succès", systemUser, systemUser);

    return res
      .status(201)
      .json({ success: true, message: "Label ajouté avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'ajout du label :", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'ajout du label.",
    });
  }
}
export async function updateLabel(req, res) {
  const systemUser = {
    _id: new ObjectId('60d0fe4f5311236168a109ca'), 
    name: 'système',
    email: 'system@domain.com' 
  };
  const labelNumber = req.params.labelNumber; 
  const labelId = req.params.id;
  const { label } = req.body;

  try {
    let labelModel;
    switch (labelNumber) {
      case "1":
        labelModel = label1;
        break;
      case "2":
        labelModel = label2;
        break;
      case "3":
        labelModel = Label3;
        break;
      case "4":
        labelModel = Label4;
        break;
      case "5":
        labelModel = Label5;
        break;
      default:
        return res.status(400).json({ message: "Invalid label number" });
    }

    const existingLabel = await labelModel.findById(labelId);

    if (!existingLabel) {
      return res.status(404).json({ message: "Label not found" });
    }

    existingLabel.label = label;
    await existingLabel.save();
    await sendMissionNotification("Un nouveau libellé est modifié avec succès", systemUser, systemUser);

    res.status(200).json({ message: "Label updated successfully", label });
  } catch (error) {
    res.status(500).json({ message: "Error updating label", error });
  }
}


export async function updateLabelsFromMapping(req, res) {
  try {
    const mappingEntries = Object.entries(racineLibelle1Mapping);
    const promises = mappingEntries.map(([rootId, label]) => {
      return label1.findOneAndUpdate({ rootId }, { label });
    });
    await Promise.all(promises);
    res.json({
      message: "Libellés mis à jour avec succès à partir du mapping",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des libellés à partir du mapping :",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la mise à jour des libellés à partir du mapping",
    });
  }
}
export async function insertPredefinedLabels() {
  try {
    const labels = Object.entries(racineLibelle1Mapping).map(
      ([rootId, label]) => ({
        rootId,
        label,
      })
    );
    await label1.create(labels);
    console.log("Libellés pré-définis insérés avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des libellés pré-définis :",
      error
    );
  }
}
export async function insertPredefinedLabels2() {
  try {
    const labels = Object.entries(racineLibelle2Mapping).map(
      ([rootId, label]) => ({
        rootId,
        label,
      })
    );
    await label2.create(labels);
    console.log("Libellés pré-définis insérés avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des libellés pré-définis :",
      error
    );
  }
}
export async function insertPredefinedLabels3() {
  try {
    const labels = Object.entries(racineLibelle3Mapping).map(
      ([rootId, label]) => ({
        rootId,
        label,
      })
    );
    await Label3.create(labels);
    console.log("Libellés pré-définis insérés avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des libellés pré-définis :",
      error
    );
  }
}
export async function insertPredefinedLabels4() {
  try {
    const labels = Object.entries(racineLibelle4Mapping).map(
      ([rootId, label]) => ({
        rootId,
        label,
      })
    );
    await Label4.create(labels);
    console.log("Libellés pré-définis insérés avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des libellés pré-définis :",
      error
    );
  }
}
export async function insertPredefinedLabels5() {
  try {
    const labels = Object.entries(racineLibelle5Mapping).map(
      ([rootId, label]) => ({
        rootId,
        label,
      })
    );
    await Label5.create(labels);
    console.log("Libellés pré-définis insérés avec succès.");
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion des libellés pré-définis :",
      error
    );
  }
}export async function deleteLabel(req, res) {
  const systemUser = {
    _id: new ObjectId('60d0fe4f5311236168a109ca'), 
    name: 'système',
    email: 'system@domain.com' 
  };
  try {
    const labelNumber = req.params.labelNumber; // Nouveau paramètre pour spécifier le numéro du label
    const labelId = req.params.labelId;

    // Rechercher le modèle de label en fonction du numéro spécifié
    let labelModel;
    switch (labelNumber) {
      case "1":
        labelModel = label1;
        break;
      case "2":
        labelModel = label2;
        break;
      case "3":
        labelModel = Label3;
        break;
      case "4":
        labelModel = Label4;
        break;
      case "5":
        labelModel = Label5;
        break;
      default:
        return res.status(400).json({ message: "Invalid label number" });
    }

    await labelModel.findByIdAndDelete(labelId);
    await sendMissionNotification("Le libellé est supprimé avec succès", systemUser, systemUser);

    res.status(200).json({ message: "Label supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Une erreur est survenue lors de la suppression du label",
      error,
    });
  }
}

