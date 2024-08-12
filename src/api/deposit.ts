import express from 'express';
import { StakeInfo } from '../models/stakeInfoModel';
import { User } from '../models/userModel';
import { Bot } from '../models/botModel';

const router = express.Router();

router.post('/api/deposit', async (req, res) => {
    const { user_id, bot_id, amount } = req.body;

    try {
        const user: User = await User.findById(user_id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Increment the user's balance
        user.balance += amount;
        await user.save();

        // Create a new transaction
        const newTransaction: StakeInfo = new StakeInfo({
            user_id,
            bot_id,
            timestamp: new Date(),
            amount,
        });
        await newTransaction.save();

        const bot: Bot = await Bot.findById(bot_id);
        if (bot) {
            bot.subscribers += 1;
            await bot.save();
        } else {
            return res.status(404).json({ success: false, message: 'Bot not found' });
        }

        res.json({ success: true, balance: user.balance });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

export default router;