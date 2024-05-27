import mongoose from "mongoose";
const { Schema, model } = mongoose;
import { racineLibelle3Mapping } from "./mapping.js";

const LabelSchema3 = new Schema({
  rootId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});
export default mongoose.model("Label3", LabelSchema3);

