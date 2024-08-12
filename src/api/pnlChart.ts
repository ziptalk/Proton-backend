import express from 'express';
import { Balance, iBalance } from '../models/balanceModel';
import { User } from '../models/userModel';

const router = express.Router();

interface QueryParams {
    bot_id?: string;
    user_id?: string;
    timeframe?: string;
}

router.get('/api/PnLChart', async (req, res) => {
    const { bot_id, user_id, timeframe }: QueryParams = req.query;

    if (!bot_id || !user_id || !timeframe) {
        return res.status(400).json({ error: 'bot_id, user_id, and timeframe are required' });
    }

    try {
        const query: any = { bot_id };
        const balanceData: iBalance[] = await Balance.find(query).sort({ timestamp: -1 }).limit(parseInt(timeframe as string, 10)).exec();
        balanceData.reverse();

        const user = await User.findOne({ user_id: user_id }).exec();
        const availableBalance = user ? user.available_balance : 0;

        const response = {
            bot_id,
            timeframe: parseInt(timeframe as string, 10),
            Available: availableBalance,
            data: balanceData.map(entry => ({
                createdAt: entry.timestamp,
                pnlRate: entry.balance
            }))
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export default router;