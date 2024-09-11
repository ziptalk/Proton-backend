import express from 'express';
import { Balance, iBalance } from '../models/balanceModel';
import { Bot, iBot } from "../models/botModel";
import { getProfitPerBot } from "../services/botService";

const router = express.Router();

interface QueryParams {
    bot_id?: string;
    user_id?: string;
    timeframe?: string;
}

interface BotDetailInformation {
    apy: number;
    winRate: number;
    mdd: number;
}

router.get('/api/PnLChart', async (req, res) => {
    const { bot_id, user_id, timeframe }: QueryParams = req.query;
    // TODO: remove unnecessary query param(user_id)

    if (!bot_id || !user_id || !timeframe) {
        return res.status(400).json({ error: 'bot_id, user_id, and timeframe are required' });
    }

    try {
        const bot: iBot | null = await Bot.findOne({ bot_id }).exec();
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }

        const balanceData: iBalance[] = await Balance.find({ bot_id })
            .sort({ timestamp: -1 })
            .limit(parseInt(timeframe as string, 10))
            .exec();
        balanceData.reverse();

        const botDetailInformation: BotDetailInformation = {
            apy: 15.5,
            winRate: 70,
            mdd: 11
        };

        const dailyPNL: number = await getProfitPerBot(bot.bot_id, user_id, true);

        const response = {
            bot_id: bot.bot_id,
            bot_name: bot.name,
            timeframe: parseInt(timeframe as string, 10),
            daily_PnL: dailyPNL.toFixed(2),
            data: balanceData.map(entry => ({
                createdAt: entry.timestamp,
                balance: entry.balanceRate
            })),
            detailInformation: botDetailInformation,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export default router;