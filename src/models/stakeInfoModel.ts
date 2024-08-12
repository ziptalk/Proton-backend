import mongoose, { Schema } from 'mongoose';

const StakeInfoSchema = new Schema({
    bot_id: String,
    user_id: String,
    timestamp: Date,
    amount: Number,
});

export const StakeInfo = mongoose.model('StakeInfo', StakeInfoSchema);