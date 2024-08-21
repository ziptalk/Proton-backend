import express from 'express';
import { User } from '../models/userModel';
import { Bot, iBot } from '../models/botModel';
import { Balance, iBalance } from '../models/balanceModel';
import { iStakeInfo, StakeInfo } from '../models/stakeInfoModel';

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

        let totalBalance = 0;
        let totalProfit = 0;
        let totalBalanceUSDT = 0; // USDT 값은 나중에 환율 API를 통해 추가적으로 계산
        let totalProfitUSDT = 0; // 마찬가지로 나중에 계산

        const botsData = [];
        const processedBotIds = new Set<string>();

        for (let stakeInfo of stakeInfos) {
            const botId = stakeInfo.bot_id;

            if (processedBotIds.has(botId)) {
                continue;
            }

            const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
            const latestBalance: iBalance | null = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
            if (bot && latestBalance) {
                const currentValue = latestBalance.balance;
                const totalInvestment = stakeInfo.amount;
                const totalProfitPerBot = currentValue - totalInvestment;
                const dailyPnl = 0;
                totalBalance += currentValue;
                totalProfit += totalProfitPerBot;

                if (!token || (token && bot.chain === token)) {
                    botsData.push({
                        bot_id: bot.bot_id,
                        bot_name: bot.name,
                        total_investment: totalInvestment,
                        current_value: currentValue,
                        daily_pnl: dailyPnl,
                        total_profit: totalProfitPerBot
                    });
                }
                processedBotIds.add(botId);
            }
        }

        const dashboardData = {
            total_balance: totalBalance,
            total_profit: totalProfit,
            total_balance_usdt: totalBalanceUSDT,
            total_profit_usdt: totalProfitUSDT,
            bots: botsData
        };

        res.json(dashboardData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;