"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketMessageType = exports.createPaginatedResponse = exports.createErrorResponse = exports.createSuccessResponse = exports.ApiErrorCode = exports.HttpStatusCode = void 0;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["CREATED"] = 201] = "CREATED";
    HttpStatusCode[HttpStatusCode["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatusCode[HttpStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatusCode[HttpStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatusCode[HttpStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatusCode[HttpStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatusCode[HttpStatusCode["CONFLICT"] = 409] = "CONFLICT";
    HttpStatusCode[HttpStatusCode["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatusCode[HttpStatusCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatusCode[HttpStatusCode["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
    HttpStatusCode[HttpStatusCode["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HttpStatusCode = exports.HttpStatusCode || (exports.HttpStatusCode = {}));
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
    ApiErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ApiErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ApiErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ApiErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ApiErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    ApiErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ApiErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    ApiErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ApiErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    ApiErrorCode["EMAIL_ALREADY_VERIFIED"] = "EMAIL_ALREADY_VERIFIED";
    ApiErrorCode["INVALID_VERIFICATION_TOKEN"] = "INVALID_VERIFICATION_TOKEN";
    ApiErrorCode["WEAK_PASSWORD"] = "WEAK_PASSWORD";
    ApiErrorCode["TOUR_NOT_FOUND"] = "TOUR_NOT_FOUND";
    ApiErrorCode["TOUR_UNAVAILABLE"] = "TOUR_UNAVAILABLE";
    ApiErrorCode["TOUR_CAPACITY_EXCEEDED"] = "TOUR_CAPACITY_EXCEEDED";
    ApiErrorCode["INVALID_TOUR_DATE"] = "INVALID_TOUR_DATE";
    ApiErrorCode["BOOKING_NOT_FOUND"] = "BOOKING_NOT_FOUND";
    ApiErrorCode["BOOKING_ALREADY_CONFIRMED"] = "BOOKING_ALREADY_CONFIRMED";
    ApiErrorCode["BOOKING_ALREADY_CANCELLED"] = "BOOKING_ALREADY_CANCELLED";
    ApiErrorCode["BOOKING_DATE_PASSED"] = "BOOKING_DATE_PASSED";
    ApiErrorCode["CANNOT_CANCEL_BOOKING"] = "CANNOT_CANCEL_BOOKING";
    ApiErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    ApiErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    ApiErrorCode["INVALID_PAYMENT_METHOD"] = "INVALID_PAYMENT_METHOD";
    ApiErrorCode["PAYMENT_GATEWAY_ERROR"] = "PAYMENT_GATEWAY_ERROR";
    ApiErrorCode["REFUND_FAILED"] = "REFUND_FAILED";
    ApiErrorCode["DATABASE_CONNECTION_ERROR"] = "DATABASE_CONNECTION_ERROR";
    ApiErrorCode["DATABASE_QUERY_ERROR"] = "DATABASE_QUERY_ERROR";
    ApiErrorCode["DUPLICATE_ENTRY"] = "DUPLICATE_ENTRY";
    ApiErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ApiErrorCode["EMAIL_SERVICE_ERROR"] = "EMAIL_SERVICE_ERROR";
    ApiErrorCode["SMS_SERVICE_ERROR"] = "SMS_SERVICE_ERROR";
    ApiErrorCode["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ApiErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ApiErrorCode["MAINTENANCE_MODE"] = "MAINTENANCE_MODE";
})(ApiErrorCode = exports.ApiErrorCode || (exports.ApiErrorCode = {}));
const createSuccessResponse = (data, message, meta) => ({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
});
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (error, code, details) => ({
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
});
exports.createErrorResponse = createErrorResponse;
const createPaginatedResponse = (data, page, limit, total) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
    },
});
exports.createPaginatedResponse = createPaginatedResponse;
var WebSocketMessageType;
(function (WebSocketMessageType) {
    WebSocketMessageType["CONNECTION_ESTABLISHED"] = "connection_established";
    WebSocketMessageType["CONNECTION_CLOSED"] = "connection_closed";
    WebSocketMessageType["AUTHENTICATION_REQUIRED"] = "authentication_required";
    WebSocketMessageType["AUTHENTICATION_SUCCESS"] = "authentication_success";
    WebSocketMessageType["AUTHENTICATION_FAILED"] = "authentication_failed";
    WebSocketMessageType["BOOKING_CREATED"] = "booking_created";
    WebSocketMessageType["BOOKING_UPDATED"] = "booking_updated";
    WebSocketMessageType["BOOKING_CANCELLED"] = "booking_cancelled";
    WebSocketMessageType["BOOKING_CONFIRMED"] = "booking_confirmed";
    WebSocketMessageType["PAYMENT_PROCESSED"] = "payment_processed";
    WebSocketMessageType["PAYMENT_FAILED"] = "payment_failed";
    WebSocketMessageType["REFUND_PROCESSED"] = "refund_processed";
    WebSocketMessageType["TOUR_UPDATED"] = "tour_updated";
    WebSocketMessageType["TOUR_CAPACITY_CHANGED"] = "tour_capacity_changed";
    WebSocketMessageType["TOUR_DATE_BLOCKED"] = "tour_date_blocked";
    WebSocketMessageType["NOTIFICATION_SENT"] = "notification_sent";
    WebSocketMessageType["SYSTEM_NOTIFICATION"] = "system_notification";
    WebSocketMessageType["ERROR_OCCURRED"] = "error_occurred";
    WebSocketMessageType["WEBSOCKET_ERROR"] = "websocket_error";
})(WebSocketMessageType = exports.WebSocketMessageType || (exports.WebSocketMessageType = {}));
//# sourceMappingURL=api.js.map