import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
    address: String,
    balances: Array,
    timestamp: { type: Date, default: Date.now }
});

export const Balance = mongoose.model('Balance', balanceSchema);