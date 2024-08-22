import express from 'express';
import { iUser, User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import { sendTokens } from "../services/stargateClient";

const router = express.Router();

router.post('/api/remove', async (req, res) => {
    const { user_id, bot_id } = req.body;

    try {
        // Find all stakeInfo entries for the given user_id and bot_id
        const stakeInfos: iStakeInfo[] = await StakeInfo.find({
            bot_id: bot_id,
            user_id: user_id
        }).exec();

        if (stakeInfos.length > 0) {
            // Calculate the total amount to be returned to the user
            const totalAmount = stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);

            // Delete all the stakeInfos found
            await StakeInfo.deleteMany({
                bot_id: bot_id,
                user_id: user_id
            }).exec();

            // Update the user's available balance
            const user: iUser | null = await User.findOne({ user_id: user_id }).exec();
            if (user) {
                user.available_balance += totalAmount;
                await user.save();
            }

            // Send tokens back to the user
            await sendTokens("neutron1exd2u2rqse7tp3teq5kv0d7nuu8acyr0527fqx", user_id, totalAmount);

            // Update the bot's subscriber count
            const bot: iBot | null = await Bot.findOne({ bot_id: bot_id }).exec();
            if (bot) {
                bot.subscriber = Math.max(0, bot.subscriber - stakeInfos.length);
                await bot.save();
            }
        }

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
});

export default router;