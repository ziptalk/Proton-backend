import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { coins } from "@cosmjs/launchpad";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import dotenv from "dotenv";

dotenv.config();
const rpcEndpoint = process.env.RPC_ENDPOINT || ""; // 정확한 RPC 엔드포인트
const mnemonic = process.env.MNEMONIC || ""; // 지갑 니모닉

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

        const amount = coins(adjustedAmount.toString(), "untrn"); // 보내는 양과 denom

        // 트랜잭션을 보냅니다.
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
        // 클라이언트가 정의되어 있는지 확인하고 닫습니다.
        if (client) {
            client.disconnect();
        }
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