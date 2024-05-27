import mongoose from "mongoose";

const colonneMotCleSchema = new mongoose.Schema({
  titre: String,
  contenu: [String],
});

export default mongoose.model("CSVData", colonneMotCleSchema);
