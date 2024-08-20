import express from 'express';
import {iUser, User} from '../models/userModel';
import {Bot, iBot} from '../models/botModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import {sendTokens} from "../services/stargateClient";

const router = express.Router();

router.post('/api/remove', async (req, res) => {
    const { user_id, bot_id } = req.body;

    try {
        const stakeInfo: iStakeInfo | null = await StakeInfo.findOneAndDelete({
            bot_id: bot_id,
            user_id: user_id
        }).exec();

        if (stakeInfo) {
            const user: iUser | null = await User.findOne({ user_id: user_id }).exec();
            if (user) {
                user.available_balance += stakeInfo.amount;
                await user.save();
            }
            await sendTokens("neutron1exd2u2rqse7tp3teq5kv0d7nuu8acyr0527fqx", user_id, stakeInfo.amount)
        }

        const bot: iBot | null = await Bot.findOne({ bot_id: bot_id }).exec();
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