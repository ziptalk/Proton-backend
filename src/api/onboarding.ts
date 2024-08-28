import express from 'express';
import { getTotalInvestAmount } from "../services/botService";

const router = express.Router();

router.get('/api/onboarding', async (req, res) => {
    try {
        const totalInvestAmount = await getTotalInvestAmount();
        res.json({ total_value_locked: totalInvestAmount });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

export default router;