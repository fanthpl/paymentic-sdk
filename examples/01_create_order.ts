import "dotenv/config";
import { PaymenticClient } from "@fanth/paymentic-sdk";

const client = new PaymenticClient({
    pointId: process.env.PAYMENTIC_POINT_ID!,
    apiToken: process.env.PAYMENTIC_API_TOKEN!,
    signatureKey: process.env.PAYMENTIC_SIGNATURE_KEY!,
    sandbox: process.env.PAYMENTIC_IS_SANDBOX === "true",
});

const transaction = await client.createTransaction({
    title: "Test transaction",
    amount: "100.00",
});

console.log(transaction);
