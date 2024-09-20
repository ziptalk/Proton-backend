import mongoose, { Schema, Document } from 'mongoose';

export interface iTransaction extends Document {
    bot_id: string;
    transaction_id: string;
    timestamp: Date;
    route: string;
    in: number;
    out: number;
}

const TransactionSchema = new Schema<iTransaction>({
    bot_id: String,
    transaction_id: String,
    timestamp: Date,
    route: String,
    in: Number,
    out: Number
});

export const Transaction = mongoose.model<iTransaction>('BotTransaction', TransactionSchema);