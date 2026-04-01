import mongoose, { Schema, Document } from 'mongoose';

export interface IInviteDoc extends Document {
  email: string;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InviteSchema = new Schema<IInviteDoc>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Invite = mongoose.models.Invite || mongoose.model<IInviteDoc>('Invite', InviteSchema);
export default Invite;
