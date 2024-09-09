import mongoose, { Schema, Document } from 'mongoose';

export interface iBot extends Document {
    bot_id: string;
    address: string;
    name: string;
    subscriber: number;
    investAmount: number;
    created_at: Date;
    chain: string;
}

const BotSchema = new Schema<iBot>({
    bot_id: String,
    address: String,
    name: String,
    investAmount: Number,
    subscriber: Number,
    created_at: Date,
    chain: String,
});

export const Bot = mongoose.model<iBot>('Bot', BotSchema);