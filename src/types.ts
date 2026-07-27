export interface PaymenticCreateTransactionRequest {
    /** Amount in minor precision with up to 2 decimals */
    amount: string;
    /** ISO 4217 3-letter currency code. Defaults to PLN when omitted. */
    currency?: "PLN" | "EUR" | null;
    title: string;
    description?: string | null;
    externalReferenceId?: string | null;
    redirect?: {
        success?: string | null;
        failure?: string | null;
    } | null;
    customer?: {
        name?: string | null;
        email?: string | null;
        emailVerified?: boolean | null;
        phone?: string | null;
        phoneVerified?: boolean | null;
        /** ISO 3166-1 alpha-2 */
        country?: string | null;
        /** ISO 639-1 alpha-2 */
        locale?: string | null;
        ip?: string | null;
        userAgent?: string | null;
        fingerprint?: string | null;
    } | null;
    order?: {
        id?: string | null;
        shippingMethod?:
            | "VIRTUAL"
            | "TRACKED_DELIVERY"
            | "UNTRACKED_DELIVERY"
            | "IN_STORE_PICKUP"
            | "PARCEL_PICKUP"
            | "LOCKER_PICKUP"
            | "HYBRID"
            | "OTHER"
            | null;
        trackingNumber?: string | null;
        customerType?: "B2B" | "B2C" | null;
    } | null;
    billingAddress?: {
        firstName?: string | null;
        lastName?: string | null;
        street?: string | null;
        buildingNumber?: string | null;
        flat?: string | null;
        city?: string | null;
        region?: string | null;
        postalCode?: string | null;
        state?: string | null;
        /** ISO-3166-1 alpha-2 */
        country?: string | null;
        company?: string | null;
    } | null;
    shippingAddress?: {
        firstName?: string | null;
        lastName?: string | null;
        street?: string | null;
        buildingNumber?: string | null;
        flat?: string | null;
        city?: string | null;
        region?: string | null;
        postalCode?: string | null;
        state?: string | null;
        /** ISO-3166-1 alpha-2 */
        country?: string | null;
        company?: string | null;
    } | null;
    cart?:
        | {
              name?: string | null;
              quantity?: number | null;
              unitPrice?: string | null;
              type?: "PRODUCT" | "SHIPPING" | "DISCOUNT" | "SURCHARGE" | "GIFT_CARD" | null;
              productType?: "PHYSICAL" | "DIGITAL" | "SERVICE" | "VIRTUAL" | null;
              sku?: string | null;
          }[]
        | null;
    paymentMethod?: "BLIK" | "PBL" | "BNPL" | "CARD" | "MOBILE_WALLET" | null;
    paymentChannel?: string | null;
    /**
     * Whitelist of payment methods (optionally narrowed to a specific channel) that the gateway will present to the customer.
     * Cannot be combined with hiddenPaymentMethods, paymentMethod or paymentChannel.
     * When paymentChannel is null, all channels of that method are allowed.
     */
    allowedPaymentMethods?:
        | {
              paymentMethod: "BLIK" | "PBL" | "BNPL" | "CARD" | "MW" | "PAYSAFE";
              paymentChannel?: string | null;
          }[]
        | null;
    /**
     * List of payment methods (optionally narrowed to a specific channel) that the gateway will hide from the customer.
     * Cannot be combined with allowedPaymentMethods, paymentMethod or paymentChannel.
     * When paymentChannel is null, all channels of that method are hidden.
     */
    hiddenPaymentMethods?:
        | {
              paymentMethod: "BLIK" | "PBL" | "BNPL" | "CARD" | "MW" | "PAYSAFE";
              paymentChannel?: string | null;
          }[]
        | null;
    /** If true, store customer payment instrument for recurring transactions. */
    createRegistration?: boolean | null;
    whitelabel?: boolean | null;
    autoCapture?: boolean | null;
    expiresAt?: string | null;
}

export interface PaymenticCreateTransactionResponse {
    data: {
        /** Transaction ID */
        id: string;
        /** Transaction URL */
        redirectUrl: string;
        whitelabel?: object | null;
    };
}

interface PaymenticWebhookEnvelope {
    /** From the X-Paymentic-Notification-Id header, use for idempotency */
    notificationId: string;
    /** From the X-Paymentic-Time header */
    time: string;
}

export interface PaymenticTransactionStatusChangedNotification extends PaymenticWebhookEnvelope {
    event: "PAYMENT.TRANSACTION_STATUS_CHANGED";
    transactionId: string;
    pointId: string;
    status: "CREATED" | "PENDING" | "PAID" | "CANCELED" | "EXPIRED" | "FAILED";
    amount: string;
    currency: "PLN" | "EUR";
    commission?: string | null;
    externalReferenceId?: string | null;
    paymentMethod?: "BLIK" | "PBL" | "BNPL" | "CARD" | "MOBILE_WALLET" | null;
    paymentChannel?: string | null;
}

export interface PaymenticBlikAliasStatusChangedNotification extends PaymenticWebhookEnvelope {
    event: "PAYMENT.BLIK_ALIAS_STATUS_CHANGED";
    aliasId: string;
    pointId: string;
    status: "CREATED" | "ACTIVE" | "UNREGISTERED" | "EXPIRED";
    type: "UID" | "PAYID";
    value: string;
    expiresAt?: string | null;
}

export interface PaymenticRefundStatusChangedNotification extends PaymenticWebhookEnvelope {
    event: "PAYMENT.REFUND_STATUS_CHANGED";
    refundId: string;
    transactionId: string;
    pointId: string;
    status: "CREATED" | "ACCEPTED" | "PENDING" | "DONE" | "REJECTED" | "CANCELLED";
    amount: string;
    externalReferenceId?: string | null;
}

export interface PaymenticTransactionBlikStatusChangedNotification extends PaymenticWebhookEnvelope {
    event: "PAYMENT.TRANSACTION_BLIK_STATUS_CHANGED";
    transactionId: string;
    actionId: string;
    externalStatus:
        | "BLIK_AUTHORIZED"
        | "BLIK_CUSTOMER_DECLINED"
        | "BLIK_SYSTEM_DECLINED"
        | "BLIK_INSUFFICIENT_FUNDS"
        | "BLIK_TIMEOUT"
        | "BLIK_CUSTOMER_LIMIT";
    externalId: string;
}

export type PaymenticWebhookNotification =
    | PaymenticTransactionStatusChangedNotification
    | PaymenticBlikAliasStatusChangedNotification
    | PaymenticRefundStatusChangedNotification
    | PaymenticTransactionBlikStatusChangedNotification;

export type PaymenticWebhookEvent = PaymenticWebhookNotification["event"];
