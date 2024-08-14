import express from 'express';
import { Balance, iBalance } from '../models/balanceModel';
import { User } from '../models/userModel';
import { StakeInfo } from "../models/stakeInfoModel";
import { Bot } from "../models/botModel";

const router = express.Router();

interface QueryParams {
    bot_id?: string;
    user_id?: string;
    timeframe?: string;
}

interface BotDetailInformation {
    apy: number;
    winRate: number;
    tvl: number;
    mdd: number;
}

router.get('/api/PnLChart', async (req, res) => {
    const { bot_id, user_id, timeframe }: QueryParams = req.query;

    if (!bot_id || !user_id || !timeframe) {
        return res.status(400).json({ error: 'bot_id, user_id, and timeframe are required' });
    }

    try {
        const query: any = { bot_id };
        const bot = await Bot.findOne({ bot_id: bot_id }).exec();
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }

        const balanceData: iBalance[] = await Balance.find(query).sort({ timestamp: -1 }).limit(parseInt(timeframe as string, 10)).exec();
        balanceData.reverse();

        const user = await User.findOne({ user_id: user_id }).exec();
        const availableBalance = user ? user.available_balance : 0;

        const botDetailInformation: BotDetailInformation = {
            apy: 15.5,
            winRate: await calculateWinRate(bot.bot_id),
            tvl: await calculateTVL(bot.bot_id),
            mdd: await calculateMDD(bot.bot_id),
        };
        const response = {
            bot_id: bot.bot_id,
            bot_name: bot.name,
            timeframe: parseInt(timeframe as string, 10),
            Available: availableBalance,
            daily_PnL: await calculateDailyPnl(bot.bot_id),
            data: balanceData.map(entry => ({
                createdAt: entry.timestamp,
                pnlRate: entry.balance
            })),
            detailInformation: botDetailInformation,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

const calculateWinRate = async (botId: string): Promise<number> => {
    /*
    Win Rate
    - 봇 출시일 <= x <= 현재 날짜
    - 봇 운영 기간 = 현재 날짜 - 봇 출시일
    => (x의 잔고 / x의 총 투자금) > (x - 1의 잔고 / x - 1의 총 투자금)인 x의 수 / 봇 운영 기간
     */
    const totalBalances: iBalance[] = await Balance.find({ bot_id: botId })
        .sort({ timestamp: 1 })
        .exec();
    
    const totalDaysCount: number = totalBalances.length;
    let winningDaysCount: number = 0;

    for (let day = 1; day < totalBalances.length; day++) {
        const current: iBalance = totalBalances[day];
        const previous: iBalance = totalBalances[day - 1];

        const currentPnlRate: number = current.balance / current.investmentAmount;
        const previousPnlRate: number = previous.balance / previous.investmentAmount;

        if (currentPnlRate > previousPnlRate) {
            winningDaysCount++;
        }
    }

    const winRate: number = totalDaysCount > 0 ? winningDaysCount / totalDaysCount : 0;
    return winRate * 100;
}

export const calculateTVL = async (botId?: string): Promise<number> => {
    /*
    TVL(Total Value Locked)
    => StakeInfo의 amount의 합
     */
    let totalValueLocked = await StakeInfo.aggregate([
        {
            $match: { bot_id: botId }
        },
        {
            $group: {
                _id: null,
                total_value_locked: { $sum: "$amount" }
            }
        }
    ]);
    return totalValueLocked[0]?.total_value_locked || 0;
}

const calculateMDD = async (botId: string): Promise<number> => {
    /*
    MDD(Maximum Drawdown)
    - 봇 운영 기간 중, 가장 높은 수익률: x
    - 봇 운영 기간 중, 가장 낮은 수익률: y
    => 1 - (y / x)
     */
    const totalBalances: iBalance[] = await Balance.find({ bot_id: botId }).exec();

    let maxPnlRate: number = Number.MIN_VALUE;
    let minPnlRate: number = Number.MAX_VALUE;
    for (const balance of totalBalances) {
        const pnlRate = balance.balance / balance.investmentAmount;
        if (pnlRate > maxPnlRate) {
            maxPnlRate = pnlRate;
        }
        if (pnlRate < minPnlRate) {
            minPnlRate = pnlRate;
        }
    }

    const mdd = 1 - (minPnlRate / maxPnlRate);
    return mdd * 100;
}

const calculateDailyPnl = async (botId: string): Promise<number> => {
    /*
    Bot Daily PnL
    - 가장 최근 날짜: x라고 가정
    => (x의 잔고 / x의 총 투자금) / (x - 1의 잔고 / x - 1의 총 투자금) - 1
    */
    const todayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
    const yesterdayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).skip(1).exec();

    if (!todayBalance || !yesterdayBalance) {
        return 0;
    }

    const todayPnlRate = todayBalance.balance / todayBalance.investmentAmount;
    const yesterdayPnlRate = yesterdayBalance.balance / yesterdayBalance.investmentAmount;

    const dailyPnlRate = (todayPnlRate / yesterdayPnlRate) - 1;
    return dailyPnlRate * 100;
}

export default router;