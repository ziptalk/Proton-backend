import { Bot, iBot } from "../models/botModel";
import { Balance } from "../models/balanceModel";
import {iStakeInfo, StakeInfo} from "../models/stakeInfoModel";
import { getBalance } from "./stargateClient";

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

export const calculateBotDailyPnlRate = async (botId: string): Promise<number> => {
    // const todayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
    const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
    if (!bot) {
        throw new Error('Bot not found')
    }
    const todayBalance = await getBalance(bot.address); 
    const yesterdayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).skip(1).exec();

    if (!todayBalance || !yesterdayBalance) {
        return 0;
    }

    const dailyPnlRate = (Number(todayBalance) / yesterdayBalance.balance) - 1;
    return dailyPnlRate * 100;
}

export const getTotalStakedAmount = async (user_id: string, bot_id: string): Promise<number> => {
    const stakeInfos: iStakeInfo[] = await StakeInfo.find({ user_id: user_id, bot_id: bot_id }).exec();
    return stakeInfos.reduce((sum, stakeInfo) => sum + stakeInfo.amount, 0);
}

export const getDailyProfit = async (botId: string): Promise<number> => {
    const bot: iBot | null = await Bot.findOne({ bot_id: botId }).exec();
    if (!bot) {
        throw new Error('Bot not found')
    }
    // const todayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
    const todayBalance = await getBalance(bot.address); 
    const yesterdayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).skip(1).exec();

    if (!todayBalance || !yesterdayBalance) {
        return 0;
    }

    return Number(todayBalance) - yesterdayBalance.balance;
}