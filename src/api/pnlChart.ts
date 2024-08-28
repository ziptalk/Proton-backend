import express from 'express';
import { Balance, iBalance } from '../models/balanceModel';
import { Bot, iBot } from "../models/botModel";
import { calculateBotDailyPnlRate } from "../services/botService";

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

        const dailyPNL: number = await calculateBotDailyPnlRate(bot.bot_id);

        const response = {
            bot_id: bot.bot_id,
            bot_name: bot.name,
            timeframe: parseInt(timeframe as string, 10),
            daily_PnL: dailyPNL,
            data: balanceData.map(entry => ({
                createdAt: entry.timestamp,
                pnlRate: entry.balance
            })),
            detailInformation: botDetailInformation,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export const calculateDailyPnl = async (botId: string): Promise<[number, number]> => {
    /*
    Bot Daily PnL
    - 가장 최근 날짜: x라고 가정
    => (x의 잔고 / x의 총 투자금) / (x - 1의 잔고 / x - 1의 총 투자금) - 1
    */
    const todayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
    const yesterdayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).skip(1).exec();

    if (!todayBalance || !yesterdayBalance) {
        return [0,0];
    }

    const todayPnlRate = todayBalance.balance;
    const yesterdayPnlRate = yesterdayBalance.balance;

    const dailyPnlRate = (todayPnlRate / yesterdayPnlRate) - 1;
    return [dailyPnlRate * 100, todayPnlRate - yesterdayPnlRate];
}

export default router;