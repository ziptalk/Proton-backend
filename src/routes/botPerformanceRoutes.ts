import { Router } from 'express';
import { getBotPerformanceSummary, getBotPerformanceChart } from '../controllers/botPerformanceController';

const router = Router();

router.get('/botPerformanceSummary', getBotPerformanceSummary);
router.get('/botPerformanceChart', getBotPerformanceChart);

export default router;