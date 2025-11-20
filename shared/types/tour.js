"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TOUR_VALUES = exports.isValidLanguage = exports.isValidCurrency = exports.validateDuration = exports.validateParticipantRange = exports.validateTourPrice = exports.validateTourName = exports.TOUR_STATUSES = exports.TOUR_TYPES = exports.DIFFICULTY_LEVELS = exports.TOUR_CATEGORIES = exports.SUPPORTED_LANGUAGES = exports.SUPPORTED_CURRENCIES = exports.DEFAULT_TOUR_LIMITS = exports.TourCategory = exports.TourStatus = exports.DifficultyLevel = exports.TourType = void 0;
var TourType;
(function (TourType) {
    TourType["INBOUND_SERVICE"] = "inbound_service";
    TourType["OUTBOUND_PACKAGE"] = "outbound_package";
})(TourType = exports.TourType || (exports.TourType = {}));
var DifficultyLevel;
(function (DifficultyLevel) {
    DifficultyLevel["EASY"] = "easy";
    DifficultyLevel["MODERATE"] = "moderate";
    DifficultyLevel["CHALLENGING"] = "challenging";
})(DifficultyLevel = exports.DifficultyLevel || (exports.DifficultyLevel = {}));
var TourStatus;
(function (TourStatus) {
    TourStatus["DRAFT"] = "draft";
    TourStatus["ACTIVE"] = "active";
    TourStatus["INACTIVE"] = "inactive";
    TourStatus["ARCHIVED"] = "archived";
})(TourStatus = exports.TourStatus || (exports.TourStatus = {}));
var TourCategory;
(function (TourCategory) {
    TourCategory["CULTURAL"] = "cultural";
    TourCategory["ADVENTURE"] = "adventure";
    TourCategory["MUSEUM"] = "museum";
    TourCategory["HISTORICAL"] = "historical";
    TourCategory["FOOD"] = "food";
    TourCategory["NATURE"] = "nature";
    TourCategory["URBAN"] = "urban";
    TourCategory["RELIGIOUS"] = "religious";
    TourCategory["ENTERTAINMENT"] = "entertainment";
    TourCategory["SPORTS"] = "sports";
    TourCategory["WELLNESS"] = "wellness";
    TourCategory["SHOPPING"] = "shopping";
})(TourCategory = exports.TourCategory || (exports.TourCategory = {}));
exports.DEFAULT_TOUR_LIMITS = {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 255,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_SHORT_DESCRIPTION_LENGTH: 10,
    MAX_SHORT_DESCRIPTION_LENGTH: 500,
    MIN_PRICE: 0,
    MAX_PRICE: 10000,
    MIN_PARTICIPANTS: 1,
    MAX_PARTICIPANTS: 500,
    MIN_DURATION_HOURS: 0.5,
    MAX_DURATION_HOURS: 72,
    MIN_LANGUAGE_LENGTH: 2,
    MAX_LANGUAGE_LENGTH: 5,
    MAX_LANGUAGES: 10,
    MAX_INCLUSIONS: 20,
    MAX_EXCLUSIONS: 20,
    MAX_REQUIREMENTS: 10,
    MAX_IMAGES: 20
};
exports.SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL'
];
exports.SUPPORTED_LANGUAGES = [
    'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'
];
exports.TOUR_CATEGORIES = Object.values(TourCategory);
exports.DIFFICULTY_LEVELS = Object.values(DifficultyLevel);
exports.TOUR_TYPES = Object.values(TourType);
exports.TOUR_STATUSES = Object.values(TourStatus);
const validateTourName = (name) => {
    return name.length >= exports.DEFAULT_TOUR_LIMITS.MIN_NAME_LENGTH &&
        name.length <= exports.DEFAULT_TOUR_LIMITS.MAX_NAME_LENGTH;
};
exports.validateTourName = validateTourName;
const validateTourPrice = (price) => {
    return price >= exports.DEFAULT_TOUR_LIMITS.MIN_PRICE &&
        price <= exports.DEFAULT_TOUR_LIMITS.MAX_PRICE;
};
exports.validateTourPrice = validateTourPrice;
const validateParticipantRange = (min, max) => {
    return min >= exports.DEFAULT_TOUR_LIMITS.MIN_PARTICIPANTS &&
        max <= exports.DEFAULT_TOUR_LIMITS.MAX_PARTICIPANTS &&
        min <= max;
};
exports.validateParticipantRange = validateParticipantRange;
const validateDuration = (duration) => {
    return duration >= exports.DEFAULT_TOUR_LIMITS.MIN_DURATION_HOURS &&
        duration <= exports.DEFAULT_TOUR_LIMITS.MAX_DURATION_HOURS;
};
exports.validateDuration = validateDuration;
const isValidCurrency = (currency) => {
    return exports.SUPPORTED_CURRENCIES.includes(currency);
};
exports.isValidCurrency = isValidCurrency;
const isValidLanguage = (language) => {
    return exports.SUPPORTED_LANGUAGES.includes(language);
};
exports.isValidLanguage = isValidLanguage;
exports.DEFAULT_TOUR_VALUES = {
    status: TourStatus.DRAFT,
    difficulty_level: DifficultyLevel.MODERATE,
    languages: ['en'],
    inclusions: [],
    exclusions: [],
    requirements: [],
    images: []
};
//# sourceMappingURL=tour.js.map