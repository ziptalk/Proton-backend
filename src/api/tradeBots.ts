import express from 'express';
import { iBot, Bot } from '../models/botModel';
import { iBalance, Balance } from '../models/balanceModel';
import { getBalance } from '../services/balanceService';
import {getProfitPerBot} from "../services/botService";

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
                const firstBalance: iBalance | null = await Balance.findOne({ bot_id: bot.bot_id }).exec();
                if (!firstBalance) {
                    throw new Error(`No balance data found for bot ${bot.bot_id}`);
                }

                const totalProfits = await getProfitPerBot(bot.bot_id);
                const runtime = Math.floor((Date.now() - bot.created_at.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    bot_id: bot.bot_id,
                    name: bot.name,
                    subscriber: bot.subscriber,
                    total_profits: totalProfits.toFixed(2),
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