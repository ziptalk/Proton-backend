import express from 'express';
import { StakeInfo } from '../models/stakeInfoModel';

const router = express.Router();

router.get('/api/onboarding', async (req, res) => {
    try {
        const totalValueLocked = await StakeInfo.aggregate([
            {
                $group: {
                    _id: null,
                    total_value_locked: { $sum: "$amount" }
                }
            }
        ]);
        res.json({ total_value_locked: totalValueLocked[0]?.total_value_locked || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export default router;