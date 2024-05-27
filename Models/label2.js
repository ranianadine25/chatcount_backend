import mongoose from "mongoose";
const { Schema, model } = mongoose;
import { racineLibelle2Mapping } from "./mapping.js";

const LabelSchema2 = new Schema({
  rootId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Label2", LabelSchema2);
