import { Bot, iBot } from "../models/botModel";
import {Balance, iBalance} from "../models/balanceModel";
import {iStakeInfo, StakeInfo} from "../models/stakeInfoModel";
import {BasicSymbolParam, USDMClient} from "binance"

export const getTotalInvestAmount = async (): Promise<number> => {
    const totalInvestAmount = await Bot.aggregate([
        {
            $group: {
                _id: null,
                total_invest_amount: { $sum: "$investAmount" }
            }
        }
    ]);
    return totalInvestAmount[0]?.total_invest_amount || 0;
}

export const getProfitPerBot = async (botId: string, userId?: string, isDaily?: boolean, endDate?: Date): Promise<number> => {
    const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
    if (!bot) {
        throw new Error('Bot not found');
    }

    let startDate: Date;
    const actualEndDate = endDate || new Date();

    if (isDaily) {
        if (userId) {
            throw new Error('Daily profit is not supported for individual users');
        }
        startDate = new Date(actualEndDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
        if (userId) {
            const firstStake = await StakeInfo.findOne({ bot_id: botId, user_id: userId }).sort({ timestamp: 1 }).exec();
            startDate = firstStake ? firstStake.timestamp : new Date(0);
        } else {
            const firstBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: 1 }).exec();
            startDate = firstBalance ? firstBalance.timestamp : new Date(0);
        }
    }

    const stakeInfoQuery: any = { 
        bot_id: botId, 
        timestamp: { $gte: startDate, $lte: actualEndDate } 
    };
    if (userId) {
        stakeInfoQuery.user_id = userId;
    }

    const stakeInfos = await StakeInfo.find(stakeInfoQuery).sort({ timestamp: 1 }).exec();

    return calculatePnlRate(botId, startDate, actualEndDate, stakeInfos, userId);
};

async function calculatePnlRate(botId: string, startDate: Date, endDate: Date, stakeInfos: iStakeInfo[], userId?: string): Promise<number> {
    const firstBalance = await Balance.findOne({ 
        bot_id: botId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 }).exec();

    const lastBalance = await Balance.findOne({ 
        bot_id: botId,
        timestamp: { $lte: endDate }
    }).sort({ timestamp: -1 }).exec();

    if (!firstBalance || !lastBalance || firstBalance.balanceRate === 0) {
        return 0;
    }
    let totalPnlRate = 1;
    let prevBalance = firstBalance;

    for (const stakeInfo of stakeInfos) {
        const balanceBeforeStake = await Balance.findOne({
            bot_id: botId,
            timestamp: { $lt: stakeInfo.timestamp }
        }).sort({ timestamp: -1 }).exec();

        const balanceAfterStake = await Balance.findOne({
            bot_id: botId,
            timestamp: { $gt: stakeInfo.timestamp }
        }).sort({ timestamp: 1 }).exec();

        if (balanceBeforeStake && balanceAfterStake && prevBalance.balanceRate !== 0) {
            const pnlRateBeforeStake = (balanceBeforeStake.balanceRate - prevBalance.balanceRate) / prevBalance.balanceRate;
            
            if (userId) {
                const userStakeRatio = stakeInfo.amount / balanceBeforeStake.balance;
                totalPnlRate *= (1 + pnlRateBeforeStake * userStakeRatio);
            } else {
                totalPnlRate *= (1 + pnlRateBeforeStake);
            }
            
            prevBalance = balanceAfterStake;
        }
    }

    if (prevBalance.balanceRate !== 0) {
        const finalPnlRate = (lastBalance.balanceRate - prevBalance.balanceRate) / prevBalance.balanceRate;
        
        // 사용자별 계산인 경우, 마지막 스테이킹 비율에 따라 최종 PNL 조정
        if (userId && stakeInfos.length > 0) {
            const lastStakeInfo = stakeInfos[stakeInfos.length - 1];
            const userStakeRatio = lastStakeInfo.amount / prevBalance.balance;
            totalPnlRate *= (1 + finalPnlRate * userStakeRatio);
        } else {
            totalPnlRate *= (1 + finalPnlRate);
        }
    }

    console.log(`Total PNL Rate: ${totalPnlRate - 1}`);
    return (totalPnlRate - 1) * 100;
}

export const getTotalStakedAmount = async (bot_id: string, user_id?: string): Promise<number> => {
    let stakeInfos: iStakeInfo[] = [];
    if(user_id) stakeInfos = await StakeInfo.find({ user_id: user_id, bot_id: bot_id }).exec();
    else stakeInfos = await StakeInfo.find({ bot_id: bot_id }).exec();
    return stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);
}
const client = new USDMClient({});
export async function getPrice(symbol: string): Promise<any> {
    try {
        const data : BasicSymbolParam = {
            symbol: symbol
        }
        const response = await client.getMarkPrice(data);
        return response.markPrice
    } catch (error) {
        console.error('선물 가격을 가져오는 중 오류 발생:', error);
        throw error;
    }
}
