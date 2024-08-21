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

        const botIds = stakeInfos.map(info => info.bot_id);

        const bots = await Bot.find({ bot_id: { $in: botIds } }).exec();

        const balances = await Balance.aggregate([
            { $match: { bot_id: { $in: botIds } } },
            { $sort: { timestamp: -1 } },
            { $group: { _id: "$bot_id", balance: { $first: "$balance" } } }
        ]).exec();

        const botMap = new Map<string, iBot>();
        const balanceMap = new Map<string, number>();

        bots.forEach(bot => botMap.set(bot.bot_id, bot));
        balances.forEach(balance => balanceMap.set(balance._id, balance.balance));

        let totalBalance = 0;
        let totalProfit = 0;
        let totalBalanceUSDT = 0;
        let totalProfitUSDT = 0;

        const botsData = [];

        for (let stakeInfo of stakeInfos) {
            const botId = stakeInfo.bot_id;

            const bot = botMap.get(botId);
            const currentValue = balanceMap.get(botId) || 0;

            if (bot) {
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