import mongoose, { Schema, Document } from 'mongoose';

export interface iBalance extends Document {
    bot_id: string;
    timestamp: Date;
    balance: number;
}

const balanceSchema = new Schema<iBalance>({
    bot_id: String,
    timestamp: Date,
    balance: Number,
});

export const Balance = mongoose.model<iBalance>('balance', balanceSchema);
