import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { coins } from "@cosmjs/launchpad";
import {assertIsDeliverTxSuccess, SigningStargateClient} from "@cosmjs/stargate";
import dotenv from "dotenv";
import { Bot, iBot } from "../models/botModel";
import { Balance, iBalance } from "../models/balanceModel";
import {getTotalStakedAmount} from "./botService";


dotenv.config();
const rpcEndpoint = process.env.RPC_ENDPOINT || "";
const mnemonic = process.env.MNEMONIC || "";


export async function sendTokens(senderAddress: string, recipientAddress: string, amountToSend: number) {
    let client;
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
            prefix: "neutron",
        });

        client = await SigningStargateClient.connectWithSigner(
            rpcEndpoint,
            wallet
        );
        const adjustedAmount = amountToSend * 10 ** 6;

        const amount = coins(adjustedAmount.toString(), "untrn");

        const fee = {
            amount: coins(887, "untrn"), // 수수료
            gas: "139400", // 가스 비용
        };

        const result = await client.sendTokens(senderAddress, recipientAddress, amount, fee);

        assertIsDeliverTxSuccess(result);
        console.log("Transaction successful:", result.transactionHash);

    } catch (error) {
        console.error("Failed to send transaction:", error);
    } finally {
        if (client) {
            client.disconnect();
        }
    }
}

export async function getBalance(address: string):Promise<number>{
    const client = await SigningStargateClient.connect(rpcEndpoint);

    const balance = await client.getBalance(address, "untrn");

    if(!balance){
        throw new Error(`Failed to get balance for address ${address}`);
    }
    client.disconnect();

    return Number(balance.amount) / 10 ** 6;
}

export async function saveBotBalance(){
    try {
        
        const bots: iBot[] = await Bot.find().exec();

        for (const bot of bots){
            
            const latestBalance = await getBalance(bot.address);
            const stakeAmount = await getTotalStakedAmount(bot.bot_id)

            const balance: iBalance = new Balance({
                bot_id: bot.bot_id,
                timestamp: new Date(),
                balance: latestBalance,
                balanceRate: latestBalance / stakeAmount,
            });

            await balance.save();
        }
    } catch (error) {
        console.error(`Failed to save balance:`, error);
    }
}
