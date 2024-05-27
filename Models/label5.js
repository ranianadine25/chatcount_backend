import mongoose from "mongoose";
const { Schema, model } = mongoose;
import { racineLibelle5Mapping } from "./mapping.js";

const LabelSchema5 = new Schema({
  rootId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});
export default mongoose.model("Label5", LabelSchema5);

