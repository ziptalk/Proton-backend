import express from 'express';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import { iUser, User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';

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

        let user = await User.findOne({ user_id: user_id }).exec();

        if (!user) {
            user = new User({
                user_id,
                total_balance: 0,
                available_balance: 0
            });
        }

        user.available_balance += amount;
        user.total_balance += amount;
        await user.save();

        const newTransaction: iStakeInfo = new StakeInfo({
            user_id,
            bot_id,
            timestamp: new Date(),
            amount,
        });
        await newTransaction.save();

        bot.subscriber += 1;
        await bot.save();

        res.json({ success: true, balance: user.available_balance });
    } catch (error: any) {
        console.error('An error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

export default router;