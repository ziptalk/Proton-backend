import express from 'express';
import { Bot } from '../models/botModel';
import { balance } from '../models/balanceModel';

const router = express.Router();

const APY = 15.5;

router.get('/api/trade-bots', async (req, res) => {
    const { sort = 'total_profits', order = 'desc', search = '' } = req.query;
    const sortOrder = order === 'asc' ? 1 : -1;

    try {
        const bots: Bot[] = await Bot.find({ name: { $regex: search, $options: 'i' } }).exec();

        const botsWithCalculatedData = await Promise.all(
            bots.map(async (bot) => {
                const pnlData: balance[] = await balance.find({ bot_id: bot.bot_id }).sort({ timestamp: -1 }).exec();

                const totalProfits = pnlData.reduce((acc, record) => acc + record.balance, 0);
                const tvl = pnlData.length > 0 ? pnlData[0].balance : 0;
                const runtime = Math.floor((Date.now() - bot.created_at.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    bot_id: bot.bot_id,
                    name: bot.name,
                    subscriber: bot.subscriber,
                    total_profits: totalProfits,
                    apy: APY,
                    runtime: runtime,
                    tvl: tvl,
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