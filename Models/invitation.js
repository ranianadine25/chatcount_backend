import mongoose from 'mongoose';
const InvitationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' }, // Expire après 7 jours
  });
  
const Invitation = mongoose.model('Invitation', InvitationSchema);

export default  Invitation;