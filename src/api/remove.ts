import express from 'express';
import {iUser, User} from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import { sendTokens } from "../services/stargateClient";
import { Balance, iBalance } from "../models/balanceModel";
import { validateUnstakableDate } from "../services/stakingService";

const router = express.Router();

router.post('/api/remove', async (req, res) => {
    const { user_id, bot_id } = req.body;

    try {
        const bot: iBot | null = await Bot.findOne({ bot_id: bot_id }).exec();
        if (!bot) {
            return res.status(404).json({ success: false, message: 'Bot not found' });
        }
        let user = await User.findOne({ user_id: user_id }).exec();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const stakeInfos: iStakeInfo[] = await StakeInfo.find({
            bot_id: bot_id,
            user_id: user_id
        }).sort({ timestamp: -1 }).exec();

        if (stakeInfos.length === 0) {
            return res.status(404).json({ success: false, message: 'No stakes found for this user and bot' });
        }

        validateUnstakableDate(stakeInfos[0]);

        await StakeInfo.deleteMany({
            bot_id: bot_id,
            user_id: user_id
        }).exec();

        const totalAmount = stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);
        await subtractUserStakeAmount(user, totalAmount);
        await subtractBotBalance(bot_id, totalAmount);
        await sendTokens("neutron1exd2u2rqse7tp3teq5kv0d7nuu8acyr0527fqx", user_id, totalAmount);
        await updateBotInfo(bot, totalAmount);

        return res.json({ success: true, balance: user.stakeAmount });
    } catch (error: any) {
        console.error('An error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

const subtractUserStakeAmount = async (user: iUser, amount: number) => {
    user.stakeAmount = Math.max(0, user.stakeAmount - amount);
    await user.save();
}

const subtractBotBalance = async (bot_id: string, amount: number) => {
    const balance: iBalance | null = await Balance.findOne({ bot_id: bot_id }).sort({ timestamp: -1 }).exec();
    if (!balance) {
        throw new Error('Balance not found');
    }

    balance.balance = Math.max(0, balance.balance - amount);
    await balance.save();
}

const updateBotInfo = async (bot: iBot, amount: number) => {
    bot.subscriber = Math.max(0, bot.subscriber - 1);
    bot.investAmount = Math.max(0, bot.investAmount - amount);
    await bot.save();
}

export default router;