import { iStakeInfo } from "../models/stakeInfoModel";

export const validateUnstakableDate = (lastStakeInfo: iStakeInfo): void => {
    const lastStakeDate = lastStakeInfo.timestamp;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (lastStakeDate > threeDaysAgo) {
        const error = new Error('Withdrawal not allowed. Last stake was less than 3 days ago.');
        (error as any).status = 499;
        throw error;
    }
}