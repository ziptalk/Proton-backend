import express from 'express';
import { iBot, Bot } from '../models/botModel';
import { iBalance, Balance } from '../models/balanceModel';

const router = express.Router();

const APY = 15.5;

type SortKeys = 'bot_id' | 'name' | 'subscriber' | 'total_profits' | 'apy' | 'runtime' | 'tvl' | 'chain';

interface QueryParams {
    sort?: SortKeys;
    order?: string;
    search?: string;
}


router.get('/api/trade-bots', async (req, res) => {
    const { sort = 'total_profits', order = 'desc', search = '' }: QueryParams = req.query;
    const sortOrder = order === 'asc' ? 1 : -1;

    try {
        const bots: iBot[] = await Bot.find({ name: { $regex: search, $options: 'i' } }).exec();

        const botsWithCalculatedData = await Promise.all(
            bots.map(async (bot) => {
                const pnlData: iBalance[] = await Balance.find({ bot_id: bot.bot_id }).sort({ timestamp: -1 }).exec();

                const recentData = pnlData[0];
                const oldestData = pnlData[pnlData.length - 1];

                const totalProfits = parseFloat((recentData.balance / oldestData.balance - 1).toFixed(2));                const runtime = Math.floor((Date.now() - bot.created_at.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    bot_id: bot.bot_id,
                    name: bot.name,
                    subscriber: bot.subscriber,
                    total_profits: totalProfits * 100,
                    apy: APY,
                    runtime: runtime,
                    tvl: bot.investAmount,
                    chain: bot.chain,
                };
            })
        );

        const sortedBots = botsWithCalculatedData.sort((a, b) => {
            if (a[sort] < b[sort]) return -sortOrder;
            if (a[sort] > b[sort]) return sortOrder;
            return 0;
        });

        res.json(sortedBots);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export default router;