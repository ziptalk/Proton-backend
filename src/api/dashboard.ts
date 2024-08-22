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

        const stakeInfos: iStakeInfo[] = await StakeInfo.find({ user_id: user_id }).exec();

        // Create a map to store bot data by bot_id
        const botDataMap = new Map<string, any>();
        const NTRNUSDT = 0.39
        let totalBalance = 0;
        let totalProfit = 0;

        // Collect unique bot_ids
        const uniqueBotIds = new Set(stakeInfos.map(stakeInfo => stakeInfo.bot_id));

        for (let botId of uniqueBotIds) {
            const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
            const latestBalance: iBalance | null = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();

            if (bot && latestBalance) {
                let totalInvestment = 0;
                stakeInfos
                    .filter(stakeInfo => stakeInfo.bot_id === botId)
                    .forEach(stakeInfo => {
                        totalInvestment += stakeInfo.amount;
                    });

                const currentValue = latestBalance.balance;
                const totalProfitPerBot = currentValue - totalInvestment;
                const dailyPnl = await calculateDailyPnl(botId);

                totalBalance += currentValue;
                totalProfit += totalProfitPerBot;

                if (!token || (token && bot.chain === token)) {
                    botDataMap.set(botId, {
                        bot_id: bot.bot_id,
                        bot_name: bot.name,
                        total_investment: totalInvestment,
                        current_value: currentValue,
                        daily_pnl: dailyPnl,
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