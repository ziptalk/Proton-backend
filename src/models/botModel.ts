import mongoose, { Schema } from 'mongoose';

const BotSchema = new Schema({
    bot_id: String,
    name: String,
    subscriber: Number,
    created_at: Date,
    chain: String,
});

export const Bot = mongoose.model('Bot', BotSchema);