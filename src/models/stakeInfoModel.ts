import mongoose, { Schema, Document } from 'mongoose';

export interface iStakeInfo extends Document{
    bot_id: string;
    user_id: string;
    timestamp: Date;
    amount: number;
}

const StakeInfoSchema = new Schema<iStakeInfo>({
    bot_id: String,
    user_id: String,
    timestamp: Date,
    amount: Number,
});

export const StakeInfo = mongoose.model<iStakeInfo>('StakeInfo', StakeInfoSchema);