import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
    user_id: String,
    total_balance: Number,
    available_balance: Number
});

export const User = mongoose.model('User', UserSchema);