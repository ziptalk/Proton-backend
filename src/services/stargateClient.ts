import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { coins } from "@cosmjs/launchpad";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import dotenv from "dotenv";
import { Bot, iBot } from "../models/botModel";
import { Balance, iBalance } from "../models/balanceModel";


dotenv.config();
const rpcEndpoint = process.env.RPC_ENDPOINT || ""; // 정확한 RPC 엔드포인트
const mnemonic = process.env.MNEMONIC || ""; // 지갑 니모닉

const ONE_DAY_MS = 24 * 60 * 60 * 1000;


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

export async function getBalance(address: string):Promise<string | undefined>{
    try {
        const client = await SigningStargateClient.connect(rpcEndpoint);
        
        const balance = await client.getBalance(address, "untrn");
        
        client.disconnect();
        
        console.log(balance.amount);
        
        return balance.amount;
    } catch (error) {
        if(error instanceof Error){
            console.error(`Failed to get balance for address ${address}:`, error);
            throw new Error(`Unable to fetch balance for ${address}: ${error.message}`);
        }
    }
}

export async function saveBotBalance(){
    try {
        const bots: iBot[] = await Bot.find({}).exec();

        for (const bot of bots){
            
            const latestBalance = await getBalance(bot.address);
            if(!latestBalance){
                throw new Error(`Failed to get balance for address ${bot.address}`);
            }

            const balance = new Balance({
                bot_id: bot.address,
                balance: Number(latestBalance),
                timestamp: new Date(),
            });

            await Balance.findOneAndUpdate(
                { bot_id: bot.address },
                balance,
                { upsert: true, new: true } 
            );
        }
    } catch (error) {
        console.error(`Failed to save balance:`, error);
    }
}

//
// // 사용 예시
// sendTokens(
//     "neutron1exd2u2rqse7tp3teq5kv0d7nuu8acyr0527fqx", // 받는 주소
//
//     "neutron14kf3lqhnzrc87zwn2j8984cv7xt74lhm980ney", // 보내는 주소
//     1
// ).catch((error) => {
//     console.error("Unexpected error occurred:", error);
// });


