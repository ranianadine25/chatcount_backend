import mongoose from "mongoose";

const { Schema, model } = mongoose;

const MessageSchema = new Schema({
  sender: { type: String },
  text: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }, // Nouvelle propriété pour les likes
  dislikes: { type: Number, default: 0 }, // Nouvelle propriété pour les dislikes
  comments: [{ type: String }],
});

const ConversationSchema = new Schema({
  messages: [MessageSchema],
  date: { type: Date, required: true },
  name: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  fecId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fec",
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  }],
});

export default model("conversation", ConversationSchema);
