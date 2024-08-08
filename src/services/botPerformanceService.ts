import {Transaction} from '../models/transactionModel';
import {Balance} from '../models/balanceModel';

export const getPnLRate = async (): Promise<number> => {
    const initialBalance = await Balance.findOne().sort({createdAt: 1}).exec();
    const latestBalance = await Balance.findOne().sort({createdAt: -1}).exec();

    // return calculatePnL(initialBalance, latestBalance);
    return 0
};

export const getPnLWinRate = async (): Promise<number> => {
    const transactions = await Transaction.find().sort({ createdAt: 1 }).exec();

    const totalDaysCount = transactions.length;
    let winningDaysCount = 0;

    for (let i = 1; i < transactions.length; i++) {
        const current = transactions[i];
        const previous = transactions[i - 1];

        // const currentPnlRate = calculatePnL(current);
        // const previousPnlRate = calculatePnL(previous);
        //
        // if (currentPnlRate > previousPnlRate) {
        //     winningDaysCount++;
        // }
    }

    return totalDaysCount > 0 ? (winningDaysCount / totalDaysCount) * 100 : 0;
};

export const getAPY = async (): Promise<number> => {
    // Assuming APY is calculated based on some historical balance data
    const initialBalance = await Balance.findOne().sort({ createdAt: 1 }).exec();
    const latestBalance = await Balance.findOne().sort({ createdAt: -1 }).exec();

    // Placeholder for APY calculation logic
    const apy: number = 0.6010322186;
    return apy * 100;
};

export const getTVL = async (): Promise<number> => {
    const balances = await Balance.find().exec();
    return balances.reduce((sum: any, balance: { amount: any; }) => sum + balance.amount, 0);
};

export const getMDD = async (): Promise<number> => {
    const transactions = await Transaction.find().sort({ createdAt: 1 }).exec();

    let peak = -Infinity;
    let maxDrawdown = 0;

    transactions.forEach((transaction: any) => {
        const pnlRate = 0//calculatePnlRate(transaction);
        if (pnlRate > peak) {
            peak = pnlRate;
        }
        const drawdown = (peak - pnlRate) / peak;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    return maxDrawdown * 100;
};

export const getPerformanceChart = async (timeframe: number): Promise<any> => {
    const transactions = await Transaction.find({
        createdAt: {
            $gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000),
        },
    }).sort({ createdAt: 1 }).exec();

    const data = transactions.map((transaction: { createdAt: any; }) => ({
        createdAt: transaction.createdAt,
        pnlRate: 0//calculatePnlRate(transaction),
    }));

    return {
        timeframe,
        dailyPnlRate: 0.02, // Placeholder value
        data,
    };
};