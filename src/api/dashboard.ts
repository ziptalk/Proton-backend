import express from 'express';
import { User } from '../models/userModel';
import { Bot } from '../models/botModel';
import { Balance } from '../models/balanceModel';
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

        for (let stakeInfo of stakeInfos) {
            const botId = stakeInfo.bot_id;

            const bot = await Bot.findOne({ bot_id: botId });

            const latestBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 });

            if (bot && latestBalance) {
                const currentValue = latestBalance.balance;
                const totalInvestment = stakeInfo.amount;
                const totalProfitPerBot = currentValue - totalInvestment;
                const dailyPnl = 0; 
//To do: 수익률 계산 로직
                totalBalance += currentValue;
                totalProfit += totalProfitPerBot;

                if (!token || (token && bot.chain === token)) {
                    botsData.push({
                        bot_id: bot.bot_id,
                        total_investment: totalInvestment,
                        current_value: currentValue,
                        daily_pnl: dailyPnl,
                        total_profit: totalProfitPerBot
                    });
                }
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