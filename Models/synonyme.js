import mongoose from "mongoose";

const colonneSynonymeSchema = new mongoose.Schema({
  titre: String,
  contenu: [String],
});

export default mongoose.model("Synonyme", colonneSynonymeSchema);
