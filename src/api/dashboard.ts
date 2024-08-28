import express from 'express';
import { User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { Balance, iBalance } from '../models/balanceModel';
import {getDailyProfit, getTotalStakedAmount} from "../services/botService";

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
            const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
            const latestBalance: iBalance | null = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
            const totalStakedAmount = await getTotalStakedAmount(user_id, botId);

            if (bot && latestBalance && totalStakedAmount) {
                const totalProfitPerBot = (latestBalance.balance - bot.investAmount) / totalStakedAmount;
                const dailyProfit: number = await getDailyProfit(botId);

                totalProfit += totalProfitPerBot
                totalBalance += totalStakedAmount

                if (!token || (token && bot.chain === token)) {
                    botDataMap.set(botId, {
                        bot_id: bot.bot_id,
                        bot_name: bot.name,
                        total_investment: totalStakedAmount,
                        current_value: totalStakedAmount + totalProfitPerBot,
                        daily_pnl: dailyProfit / totalStakedAmount,
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
        console.log(dashboardData)
        res.json(dashboardData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;