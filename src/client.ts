import axios, { AxiosError, type AxiosInstance } from "axios";
import crypto from "crypto";
import type {
    PaymenticCreateTransactionRequest,
    PaymenticCreateTransactionResponse,
    PaymenticWebhookEvent,
    PaymenticWebhookNotification,
} from "./types.js";

export interface PaymenticConfig {
    pointId: string;
    apiToken: string;
    signatureKey: string;
    sandbox: boolean;
}

export class PaymenticInvalidSignatureError extends Error {
    constructor() {
        super("Invalid Paymentic webhook signature");
    }
}

export class PaymenticClient {
    private readonly api: AxiosInstance;
    private readonly baseUrl: string;

    constructor(private readonly config: PaymenticConfig) {
        this.baseUrl = this.config.sandbox ? "https://api.sandbox.paymentic.com/v1_2" : "https://api.paymentic.com/v1_2";
        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${this.config.apiToken}`,
            },
        });
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error({ message: "Paymentic API error", errorResponse: error.response?.data });
                throw error;
            }
        );
    }

    async createTransaction(body: PaymenticCreateTransactionRequest): Promise<PaymenticCreateTransactionResponse> {
        const response = await this.api.post<PaymenticCreateTransactionResponse>(
            `/payment/points/${this.config.pointId}/transactions`,
            body
        );
        return response.data;
    }

    private isValidSignature(payload: string, signature: string): boolean {
        // in php: base64_encode(hash_hmac('sha512', $payload, $signatureKey, true));
        const expected = crypto.createHmac("sha512", this.config.signatureKey).update(payload, "utf8").digest("base64");

        const expectedBuffer = Buffer.from(expected);
        const signatureBuffer = Buffer.from(signature);

        // Length check guards timingSafeEqual, which throws on mismatched lengths
        if (expectedBuffer.length !== signatureBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    /**
     * Verifies and parses an incoming Paymentic webhook request.
     * Throws PaymenticInvalidSignatureError if the signature does not match.
     */
    async parseWebhook(request: Request): Promise<PaymenticWebhookNotification> {
        const event = request.headers.get("x-paymentic-event") as PaymenticWebhookEvent;
        const notificationId = request.headers.get("x-paymentic-notification-id") ?? "";
        const time = request.headers.get("x-paymentic-time") ?? "";
        const signature = request.headers.get("x-paymentic-signature") ?? "";
        // User-Agent is "Paymentic/<version>", e.g. "Paymentic/1.1"
        const version = (request.headers.get("user-agent") ?? "").split("/")[1] ?? "";

        const rawBody = await request.text();
        const signaturePayload = `${event}|${version}|${rawBody}|${notificationId}|${time}`;
        if (!this.isValidSignature(signaturePayload, signature)) {
            throw new PaymenticInvalidSignatureError();
        }

        const body = JSON.parse(rawBody);
        return { ...body, event, notificationId, time };
    }
}
