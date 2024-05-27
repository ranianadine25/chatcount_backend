import mongoose from "mongoose";

const { Schema, model } = mongoose;

const dataSchema = new mongoose.Schema({
  titre: String,
  contenu: [String],
});

export default model("patterns", dataSchema);
