import mongoose, { Schema } from 'mongoose';

const balanceSchema = new Schema({
    bot_id: String,
    timestamp: Date,
    balance: Number,
});

export const balance = mongoose.model('balance', balanceSchema);