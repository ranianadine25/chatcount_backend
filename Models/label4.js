import mongoose from "mongoose";
const { Schema, model } = mongoose;
import { racineLibelle4Mapping } from "./mapping.js";

const LabelSchema4 = new Schema({
  rootId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});
export default mongoose.model("Label4", LabelSchema4);

