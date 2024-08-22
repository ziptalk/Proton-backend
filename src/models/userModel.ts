import mongoose, { Schema, Document } from 'mongoose';

export interface iUser extends Document {
    user_id: string;
    stakeAmount: number;
}

const UserSchema = new Schema<iUser>({
    user_id: String,
    stakeAmount: Number,
});

export const User = mongoose.model<iUser>('User', UserSchema);