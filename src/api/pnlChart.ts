import express from 'express';
import { balance } from '../models/balanceModel';
import { User } from '../models/userModel';

const router = express.Router();

router.get('/api/PnLChart', async (req, res) => {
    const { bot_id, user_id, timeframe } = req.query;

    try {
        const query: any = { bot_id };
        const balanceData: balance[] = await balance.find(query).sort({ timestamp: -1 }).limit(parseInt(timeframe as string, 10)).exec();
        balanceData.reverse();

        const user = await User.findOne({ user_id: user_id }).exec();
        const availableBalance = user ? (user as Document & { balance: number }).balance : 0;

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