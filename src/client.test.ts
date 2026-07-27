import assert from "node:assert";
import crypto from "node:crypto";
import { PaymenticClient, PaymenticInvalidSignatureError } from "./client.js";

const signatureKey = "test-signature-key";
const client = new PaymenticClient({ pointId: "p1", apiToken: "token", signatureKey, sandbox: true });

function sign(payload: string): string {
    return crypto.createHmac("sha512", signatureKey).update(payload, "utf8").digest("base64");
}

function buildRequest(overrides: { rawBody?: string; signature?: string } = {}): Request {
    const event = "PAYMENT.TRANSACTION_STATUS_CHANGED";
    const notificationId = "01j96yn02bhbv8j1jjtk36zn2t";
    const time = "2024-09-20T09:48:03+02:00";
    const rawBody = overrides.rawBody ?? '{"transactionId":"FJRS-LY7-3W0-30K9","pointId":"000cb241","status":"CREATED"}';
    const signature = overrides.signature ?? sign(`${event}|1.1|${rawBody}|${notificationId}|${time}`);

    return new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
            "x-paymentic-event": event,
            "x-paymentic-notification-id": notificationId,
            "x-paymentic-time": time,
            "x-paymentic-signature": signature,
            "user-agent": "Paymentic/1.1",
        },
        body: rawBody,
    });
}

// valid signature parses into typed notification, narrowed by event
const parsed = await client.parseWebhook(buildRequest());
assert.equal(parsed.event, "PAYMENT.TRANSACTION_STATUS_CHANGED");
assert.equal(parsed.notificationId, "01j96yn02bhbv8j1jjtk36zn2t");
if (parsed.event === "PAYMENT.TRANSACTION_STATUS_CHANGED") {
    assert.equal(parsed.transactionId, "FJRS-LY7-3W0-30K9");
    assert.equal(parsed.status, "CREATED");
}

// tampered body (signature computed for the original body) is rejected
const notificationId = "01j96yn02bhbv8j1jjtk36zn2t";
const time = "2024-09-20T09:48:03+02:00";
const originalBody = '{"transactionId":"FJRS-LY7-3W0-30K9","pointId":"000cb241","status":"CREATED"}';
const signature = sign(`PAYMENT.TRANSACTION_STATUS_CHANGED|1.1|${originalBody}|${notificationId}|${time}`);
await assert.rejects(
    () =>
        client.parseWebhook(
            new Request("https://example.com/webhook", {
                method: "POST",
                headers: {
                    "x-paymentic-event": "PAYMENT.TRANSACTION_STATUS_CHANGED",
                    "x-paymentic-notification-id": notificationId,
                    "x-paymentic-time": time,
                    "x-paymentic-signature": signature,
                    "user-agent": "Paymentic/1.1",
                },
                body: '{"transactionId":"tampered","pointId":"000cb241","status":"CREATED"}',
            })
        ),
    PaymenticInvalidSignatureError
);

console.log("client.test.ts: all checks passed");
