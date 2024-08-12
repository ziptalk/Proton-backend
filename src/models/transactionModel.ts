import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
    bot_id: String,
    transaction_id: String,
    timestamp: Date,
    from: String,
    to: String,
    in: Number,
    out: Number
});

export const Transaction = mongoose.model('BotTransaction', TransactionSchema);