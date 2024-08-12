import mongoose, { Schema, Document } from 'mongoose';

export interface iUser extends Document {
    user_id: string;
    total_balance: number;
    available_balance: number;
}

const UserSchema = new Schema<iUser>({
    user_id: String,
    total_balance: Number,
    available_balance: Number
});

export const User = mongoose.model<iUser>('User', UserSchema);