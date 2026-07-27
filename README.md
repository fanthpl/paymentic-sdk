# @fanth/paymentic-sdk

TypeScript SDK for the [Paymentic REST API](https://docs.paymentic.com/api/v1.2/payment-api/paymentic-payment-api).

## Install

```bash
npm install @fanth/paymentic-sdk
```

With [pnpm](https://pnpm.io/):

```bash
pnpm add @fanth/paymentic-sdk
```

## Usage

See examples in [examples](./examples) directory.

```ts
import { PaymenticClient } from "@fanth/paymentic-sdk";

const client = new PaymenticClient({
    pointId: "...",
    apiToken: "...",
    signatureKey: "...",
    sandbox: true,
});

const transaction = await client.createTransaction({
    amount: "1000",
    currency: "PLN",
    title: "Order #1",
});
```

### Webhook notifications

Use `parseWebhook` to verify and parse incoming Paymentic webhook calls. It checks the `X-Paymentic-Signature` header against the raw body and throws `PaymenticInvalidSignatureError` if it's missing or invalid.

```ts
// e.g. a Next.js route handler / any Request-based HTTP framework
export async function POST(request: Request) {
    const notification = await client.parseWebhook(request);

    if (notification.event === "PAYMENT.TRANSACTION_STATUS_CHANGED" && notification.status === "PAID") {
        // mark the order as paid
    }

    return new Response(null, { status: 200 });
}
```

> Note: `parseWebhook` reads the body via `request.text()`, so pass it the raw `Request` before any other code consumes the body.

> Note: Not all endpoints are implemented yet. If you need an endpoint that is not implemented, feel free to open up a pull request :)
