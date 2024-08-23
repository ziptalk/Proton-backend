import express from 'express';
import { iUser, User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import { sendTokens } from "../services/stargateClient";
import { Balance, iBalance } from "../models/balanceModel";

const router = express.Router();

router.post('/api/remove', async (req, res) => {
    const { user_id, bot_id } = req.body;

    try {
        const bot: iBot | null = await Bot.findOne({ bot_id: bot_id }).exec();
        if (!bot) {
            return res.status(404).json({ success: false, message: 'Bot not found' });
        }
        const stakeInfos: iStakeInfo[] = await StakeInfo.find({
            bot_id: bot_id,
            user_id: user_id
        }).sort({ timestamp: -1 }).exec();

        if (stakeInfos.length === 0) {
            return res.status(404).json({ success: false, message: 'No stakes found for this user and bot' });
        }

        const lastStakeInfoDate = new Date(stakeInfos[0].timestamp);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        if (lastStakeInfoDate > threeDaysAgo) {
            return res.status(499).json({ success: false, message: 'Withdrawal not allowed. Last stake was less than 3 days ago.' });
        }
        const totalAmount = stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);

        await StakeInfo.deleteMany({
            bot_id: bot_id,
            user_id: user_id
        }).exec();

        let user = await User.findOne({ user_id: user_id }).exec();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.stakeAmount = Math.max(0, user.stakeAmount - totalAmount);
        await user.save();

        const balance: iBalance | null = await Balance.findOne({ bot_id: bot_id }).sort({ timestamp: -1 }).exec();
        if (!balance) {
            return res.status(404).json({ success: false, message: 'Balance not found' });
        }

        balance.balance = Math.max(0, balance.balance - totalAmount);
        await balance.save();

        await sendTokens("neutron1exd2u2rqse7tp3teq5kv0d7nuu8acyr0527fqx", user_id, totalAmount);

        bot.subscriber = Math.max(0, bot.subscriber - 1);
        bot.investAmount = Math.max(0, bot.investAmount - totalAmount);
        await bot.save();

        return res.json({ success: true, balance: user.stakeAmount });
    } catch (error: any) {
        console.error('An error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

export default router;