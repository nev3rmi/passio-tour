"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookEventType = exports.PaymentGateway = exports.PaymentMethod = void 0;
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["DIGITAL_WALLET"] = "digital_wallet";
    PaymentMethod["CRYPTO"] = "crypto";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["STORE_CREDIT"] = "store_credit";
})(PaymentMethod = exports.PaymentMethod || (exports.PaymentMethod = {}));
var PaymentGateway;
(function (PaymentGateway) {
    PaymentGateway["STRIPE"] = "stripe";
    PaymentGateway["PAYPAL"] = "paypal";
    PaymentGateway["SQUARE"] = "square";
    PaymentGateway["BRAINTREE"] = "braintree";
    PaymentGateway["ADYEN"] = "adyen";
    PaymentGateway["RAZORPAY"] = "razorpay";
    PaymentGateway["MANUAL"] = "manual";
})(PaymentGateway = exports.PaymentGateway || (exports.PaymentGateway = {}));
var PaymentWebhookEventType;
(function (PaymentWebhookEventType) {
    PaymentWebhookEventType["PAYMENT_INTENT_SUCCEEDED"] = "payment_intent.succeeded";
    PaymentWebhookEventType["PAYMENT_INTENT_PAYMENT_FAILED"] = "payment_intent.payment_failed";
    PaymentWebhookEventType["CHARGE_SUCCEEDED"] = "charge.succeeded";
    PaymentWebhookEventType["CHARGE_FAILED"] = "charge.failed";
    PaymentWebhookEventType["REFUND_CREATED"] = "refund.created";
    PaymentWebhookEventType["INVOICE_PAYMENT_SUCCEEDED"] = "invoice.payment_succeeded";
    PaymentWebhookEventType["INVOICE_PAYMENT_FAILED"] = "invoice.payment_failed";
    PaymentWebhookEventType["CHECKOUT_SESSION_COMPLETED"] = "checkout.session.completed";
    PaymentWebhookEventType["PAYPAL_PAYMENT_COMPLETED"] = "PAYMENT.CAPTURE.COMPLETED";
    PaymentWebhookEventType["PAYPAL_PAYMENT_DENIED"] = "PAYMENT.CAPTURE.DENIED";
    PaymentWebhookEventType["PAYPAL_REFUND_COMPLETED"] = "PAYMENT.CAPTURE.REFUNDED";
})(PaymentWebhookEventType = exports.PaymentWebhookEventType || (exports.PaymentWebhookEventType = {}));
//# sourceMappingURL=payment.js.map