import express from 'express';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import { User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import {Balance, iBalance} from "../models/balanceModel";

const router = express.Router();

router.post('/api/deposit', async (req, res) => {
    const { user_id, bot_id, amount } = req.body;

    try {
        if (amount < 10) {
            return res.status(400).json({ success: false, message: 'Amount must be at least 10' });
        }

        const bot: iBot | null = await Bot.findOne({ bot_id: bot_id }).exec();
        if (!bot) {
            return res.status(404).json({ success: false, message: 'Bot not found' });
        }
        bot.subscriber += 1;
        bot.investAmount += amount;
        await bot.save();

        let user = await User.findOne({ user_id: user_id }).exec();
        if (!user) {
            user = new User({
                user_id,
                stakeAmount: 0,
            });
        }
        user.stakeAmount += amount;
        await user.save();

        const newStakeInfo: iStakeInfo = new StakeInfo({
            user_id,
            bot_id,
            timestamp: new Date(),
            amount,
        });
        await newStakeInfo.save();

        const balance: iBalance | null = await Balance.findOne({ bot_id: bot_id }).sort({ timestamp: -1 }).exec();
        if (!balance) {
            return res.status(404).json({ success: false, message: 'Balance not found' });
        }
        balance.balance += amount;
        await balance.save();

        res.json({ success: true, balance: user.stakeAmount });
    } catch (error: any) {
        console.error('An error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

export default router;