import mongoose from "mongoose";
const { Schema, model } = mongoose;
const fecSchema = new Schema(
  {
    name: {
      type: String,
    },
    data: {
      type: Object,
    },
    etat: {
      type: String,
      default: "non traité",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    folder: { type: Schema.Types.ObjectId, ref: "Folder" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Fec", fecSchema);
