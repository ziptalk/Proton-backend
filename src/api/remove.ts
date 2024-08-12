import express from 'express';
import { User } from '../models/userModel';
import { Bot } from '../models/botModel';
import { StakeInfo } from '../models/stakeInfoModel';

const router = express.Router();

router.post('/api/remove', async (req, res) => {
    const { user_id, bot_id } = req.body;

    try {
        const stakeInfo: StakeInfo = await StakeInfo.findOneAndDelete({ bot_id, user_id });

        if (stakeInfo) {
            const user: User = await User.findOne({ user_id });
            if (user) {
                user.available_balance += stakeInfo.amount;
                await user.save();
            }
        }

        const bot: Bot = await Bot.findOne({ bot_id });
        if (bot) {
            bot.subscriber = Math.max(0, bot.subscriber - 1);
            await bot.save();
        }

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
});

export default router;