import mongoose from "mongoose";
const { Schema, model } = mongoose;
const notificationSchema = new Schema({
    creation_date: { type: Date, default: Date.now },
    message: String,
    sender: { type: Schema.Types.ObjectId, ref: 'user' },
    seen: { type: Boolean, default: false },
    user_id: String 
});

export default model('Notification', notificationSchema);