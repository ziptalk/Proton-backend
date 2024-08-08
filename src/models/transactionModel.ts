import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    type: String,
    details: Object,
    success: Boolean,
    timestamp: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model('Transaction', transactionSchema);