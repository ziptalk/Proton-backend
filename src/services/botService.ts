import { Bot } from "../models/botModel";
import { Balance } from "../models/balanceModel";

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
    const todayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).exec();
    const yesterdayBalance = await Balance.findOne({ bot_id: botId }).sort({ timestamp: -1 }).skip(1).exec();

    if (!todayBalance || !yesterdayBalance) {
        return 0;
    }

    const dailyPnlRate = (todayBalance.balance / yesterdayBalance.balance) - 1;
    return dailyPnlRate * 100;
}