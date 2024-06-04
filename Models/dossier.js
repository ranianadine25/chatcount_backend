import mongoose from "mongoose";
const { Schema, model } = mongoose;

const folderSchema = new Schema({
  name: String,
  user: { type: Schema.Types.ObjectId, ref: "user" },
  documents: [{ type: Schema.Types.ObjectId, ref: "Fec" }],
});

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
