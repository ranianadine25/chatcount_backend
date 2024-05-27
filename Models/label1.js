import mongoose from "mongoose";
const { Schema } = mongoose;
import { racineLibelle1Mapping } from "./mapping.js";

const LabelSchema1 = new Schema({
  rootId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

// Fonction pour insérer les libellés pré-définis dans la base de données


// Insérer les libellés pré-définis au démarrage de l'application
export default mongoose.model("Label1", LabelSchema1);
