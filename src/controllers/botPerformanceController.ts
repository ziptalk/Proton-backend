import { Request, Response } from 'express';
import {
    getPnLRate,
    getPnLWinRate,
    getAPY,
    getTVL,
    getMDD,
    getPerformanceChart
} from '../services/botPerformanceService';

export const getBotPerformanceSummary = async (req: Request, res: Response) => {
    try {
        const [pnlRate, pnlWinRate, apy, tvl, mdd] = await Promise.all([
            getPnLRate(),
            getPnLWinRate(),
            getAPY(),
            getTVL(),
            getMDD()
        ]);

        res.json({ pnlRate, pnlWinRate, apy, tvl, mdd });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bot performance summary' });
    }
};

export const getBotPerformanceChart = async (req: Request, res: Response) => {
    const timeframe = parseInt(req.query.timeframe as string) || 365;
    try {
        const performanceChart = await getPerformanceChart(timeframe);
        res.json(performanceChart);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bot performance chart' });
    }
};