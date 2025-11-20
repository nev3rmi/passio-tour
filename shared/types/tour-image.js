"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_ERROR_CODES = exports.DEFAULT_TOUR_IMAGE = exports.reorderImages = exports.getPrimaryImage = exports.sortImagesByOrder = exports.generateImageVariants = exports.generateThumbnailUrl = exports.validateImageFile = exports.ALLOWED_IMAGE_FORMATS = exports.IMAGE_CONSTRAINTS = void 0;
exports.IMAGE_CONSTRAINTS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    MIN_FILE_SIZE: 1024,
    MAX_WIDTH: 4096,
    MAX_HEIGHT: 4096,
    MIN_WIDTH: 300,
    MIN_HEIGHT: 300,
    SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    THUMBNAIL_WIDTH: 400,
    THUMBNAIL_HEIGHT: 300,
    THUMBNAIL_QUALITY: 80
};
exports.ALLOWED_IMAGE_FORMATS = [
    'jpeg',
    'jpg',
    'png',
    'webp'
];
const validateImageFile = (file, fileName) => {
    const errors = [];
    const warnings = [];
    if (!file) {
        errors.push('No file provided');
        return { isValid: false, errors, warnings };
    }
    const fileSize = 'size' in file ? file.size : Buffer.byteLength(file);
    if (fileSize < exports.IMAGE_CONSTRAINTS.MIN_FILE_SIZE) {
        errors.push(`File too small. Minimum size is ${exports.IMAGE_CONSTRAINTS.MIN_FILE_SIZE} bytes`);
    }
    if (fileSize > exports.IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
        errors.push(`File too large. Maximum size is ${exports.IMAGE_CONSTRAINTS.MAX_FILE_SIZE} bytes`);
    }
    const mimeType = 'type' in file ? file.type : 'application/octet-stream';
    if (!exports.IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.includes(mimeType)) {
        errors.push(`Unsupported file format. Supported formats: ${exports.IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`);
    }
    if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (!extension || !exports.ALLOWED_IMAGE_FORMATS.includes(extension)) {
            errors.push(`Invalid file extension. Allowed extensions: ${exports.ALLOWED_IMAGE_FORMATS.join(', ')}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
};
exports.validateImageFile = validateImageFile;
const generateThumbnailUrl = (originalUrl, width = 400, height = 300) => {
    return `${originalUrl}?width=${width}&height=${height}&quality=80&format=webp`;
};
exports.generateThumbnailUrl = generateThumbnailUrl;
const generateImageVariants = (originalUrl) => {
    return {
        original: originalUrl,
        thumbnail: (0, exports.generateThumbnailUrl)(originalUrl, 400, 300),
        medium: (0, exports.generateThumbnailUrl)(originalUrl, 800, 600),
        large: (0, exports.generateThumbnailUrl)(originalUrl, 1200, 900),
        webp: (0, exports.generateThumbnailUrl)(originalUrl, undefined, undefined)
    };
};
exports.generateImageVariants = generateImageVariants;
const sortImagesByOrder = (images) => {
    return [...images].sort((a, b) => {
        if (a.is_primary && !b.is_primary)
            return -1;
        if (!a.is_primary && b.is_primary)
            return 1;
        return a.display_order - b.display_order;
    });
};
exports.sortImagesByOrder = sortImagesByOrder;
const getPrimaryImage = (images) => {
    const sorted = (0, exports.sortImagesByOrder)(images);
    return sorted.find(img => img.is_primary) || sorted[0] || null;
};
exports.getPrimaryImage = getPrimaryImage;
const reorderImages = (images, draggedIndex, targetIndex) => {
    const sorted = [...images];
    const dragged = sorted.splice(draggedIndex, 1)[0];
    sorted.splice(targetIndex, 0, dragged);
    return sorted.map((img, index) => ({
        ...img,
        display_order: index
    }));
};
exports.reorderImages = reorderImages;
exports.DEFAULT_TOUR_IMAGE = {
    url: '/images/default-tour-placeholder.jpg',
    alt_text: 'Tour image placeholder',
    is_primary: true,
    display_order: 0
};
exports.IMAGE_ERROR_CODES = {
    INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_TOO_SMALL: 'FILE_TOO_SMALL',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    PROCESSING_FAILED: 'PROCESSING_FAILED',
    IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
    INVALID_PERMISSIONS: 'INVALID_PERMISSIONS',
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED'
};
//# sourceMappingURL=tour-image.js.map