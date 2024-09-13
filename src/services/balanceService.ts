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

// import axios from 'axios';
// import * as crypto from 'crypto';
// export async function getBalance(): Promise<number> {
//     const order_url = "https://api-glb.hashkey.com/api/v1/futures/balance";
//     const timestamp = Date.now();
//
//     const params = {
//         timestamp: timestamp.toString()
//     };
//
//     const queryString = new URLSearchParams(params as any).toString();
//
//     const signature = crypto
//         .createHmac('sha256', "NhZA4av3SWMCHM8Ufv6sDNsROZMVUsHtnrokFWI9BdiWGINttQEAAy48WffEHVsD")
//         .update(queryString)
//         .digest('hex');
//
//     const url = `${order_url}?${queryString}&signature=${signature}`;
//
//     const headers = {
//         'X-HK-APIKEY': '2zHgZnUAFoI5OI2Zioj0L7wCVH7mdUl1ZP6wzcsfc6ZUEn8ZoFUXsetT1VCURToc',
//         'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//     };
//
//     const balance_response = await axios.get(url, { headers });
//     return balance_response.data[0].balance
// }

