import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager';
  adminId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager'], default: 'admin' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);
export default User;
