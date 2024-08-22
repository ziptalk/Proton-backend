import express from 'express';
import { User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { Balance, iBalance } from '../models/balanceModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';
import {calculateDailyPnl} from "./pnlChart";

const router = express.Router();

interface QueryParams {
    user_id?: string;
    token?: string;
}
const NTRNUSDT = 0.39

// GET /api/dashboard
router.get('/api/dashboard', async (req, res) => {
    try {
        const { user_id, token }: QueryParams = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findOne({ user_id: user_id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const bots: iBot[] = await Bot.find({}).exec();
        const botIds = bots.map(bot => bot.bot_id);

        const botDataMap = new Map<string, any>();
        let totalBalance = 0;
        let totalProfit = 0;

        for (let botId of botIds) {
            const stakeInfos: iStakeInfo[] = await StakeInfo.find({ user_id: user_id, bot_id: botId }).exec();
            const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
            const latestBalance: iBalance | null = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
            const stakeAmount = stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);

            if (bot && latestBalance) {
                const totalProfitPerBot = latestBalance.balance / stakeAmount - stakeAmount;
                const dailyPnl = await calculateDailyPnl(botId);

                totalProfit += totalProfitPerBot
                totalBalance += stakeAmount

                if (!token || (token && bot.chain === token)) {
                    botDataMap.set(botId, {
                        bot_id: bot.bot_id,
                        bot_name: bot.name,
                        total_investment: stakeAmount,
                        current_value: latestBalance.balance / stakeAmount,
                        daily_pnl: dailyPnl[1] / stakeAmount,
                        total_profit: totalProfitPerBot
                    });
                }
            }
        }

        const botsData = Array.from(botDataMap.values());

        const dashboardData = {
            total_balance: totalBalance,
            total_profit: totalProfit,
            total_balance_usdt: totalBalance * NTRNUSDT,
            total_profit_usdt: totalProfit * NTRNUSDT,
            bots: botsData
        };

        res.json(dashboardData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;