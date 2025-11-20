// Tour Management System - Tour Image Types and Interfaces
// Date: 2025-11-19 | Feature: Tour Management System MVP

export interface TourImage {
  image_id: string;
  tour_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TourImageCreate {
  url: string;
  alt_text: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface TourImageUpdate {
  url?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface TourImageUpload {
  file: File | Buffer;
  alt_text: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface TourImageResponse {
  success: boolean;
  data: TourImage;
  message?: string;
}

export interface BulkImageUploadResponse {
  success: boolean;
  data: {
    uploaded: TourImage[];
    failed: {
      image: TourImageUpload;
      error: string;
    }[];
  };
  message?: string;
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
}

export interface ImageUploadProgress {
  image_id?: string;
  url: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface ImageMetadata {
  file_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  format?: string;
  uploaded_at: string;
  processed_at?: string;
}

export interface TourImageWithMetadata extends TourImage {
  metadata: ImageMetadata;
  processing_status: 'pending' | 'processing' | 'processed' | 'failed';
  thumbnail_url?: string;
  webp_url?: string;
}

// Image validation and constraints
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 1024, // 1KB
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 300,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  THUMBNAIL_WIDTH: 400,
  THUMBNAIL_HEIGHT: 300,
  THUMBNAIL_QUALITY: 80
} as const;

export const ALLOWED_IMAGE_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp'
] as const;

export type ImageFormat = typeof ALLOWED_IMAGE_FORMATS[number];

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ProcessedImageResult {
  original_url: string;
  thumbnail_url: string;
  webp_url?: string;
  metadata: ImageMetadata;
}

// Image processing utilities
export const validateImageFile = (file: File | Buffer, fileName?: string): ImageValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors, warnings };
  }

  // File size validation
  const fileSize = 'size' in file ? file.size : Buffer.byteLength(file);
  if (fileSize < IMAGE_CONSTRAINTS.MIN_FILE_SIZE) {
    errors.push(`File too small. Minimum size is ${IMAGE_CONSTRAINTS.MIN_FILE_SIZE} bytes`);
  }
  if (fileSize > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.push(`File too large. Maximum size is ${IMAGE_CONSTRAINTS.MAX_FILE_SIZE} bytes`);
  }

  // MIME type validation
  const mimeType = 'type' in file ? file.type : 'application/octet-stream';
  if (!IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.includes(mimeType as any)) {
    errors.push(`Unsupported file format. Supported formats: ${IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`);
  }

  // File name validation
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_IMAGE_FORMATS.includes(extension as ImageFormat)) {
      errors.push(`Invalid file extension. Allowed extensions: ${ALLOWED_IMAGE_FORMATS.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

export const generateThumbnailUrl = (originalUrl: string, width = 400, height = 300): string => {
  // This would integrate with image processing service (e.g., Cloudinary, AWS S3 + Lambda)
  // For now, return a processed URL format
  return `${originalUrl}?width=${width}&height=${height}&quality=80&format=webp`;
};

export const generateImageVariants = (originalUrl: string) => {
  return {
    original: originalUrl,
    thumbnail: generateThumbnailUrl(originalUrl, 400, 300),
    medium: generateThumbnailUrl(originalUrl, 800, 600),
    large: generateThumbnailUrl(originalUrl, 1200, 900),
    webp: generateThumbnailUrl(originalUrl, undefined, undefined)
  };
};

export const sortImagesByOrder = (images: TourImage[]): TourImage[] => {
  return [...images].sort((a, b) => {
    // Primary images come first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    
    // Then sort by display_order
    return a.display_order - b.display_order;
  });
};

export const getPrimaryImage = (images: TourImage[]): TourImage | null => {
  const sorted = sortImagesByOrder(images);
  return sorted.find(img => img.is_primary) || sorted[0] || null;
};

export const reorderImages = (images: TourImage[], draggedIndex: number, targetIndex: number): TourImage[] => {
  const sorted = [...images];
  const dragged = sorted.splice(draggedIndex, 1)[0];
  sorted.splice(targetIndex, 0, dragged);
  
  // Update display_order values
  return sorted.map((img, index) => ({
    ...img,
    display_order: index
  }));
};

// Default image placeholder
export const DEFAULT_TOUR_IMAGE = {
  url: '/images/default-tour-placeholder.jpg',
  alt_text: 'Tour image placeholder',
  is_primary: true,
  display_order: 0
} as const;

// Image upload configuration
export interface ImageUploadConfig {
  maxFileSize: number;
  allowedFormats: string[];
  generateThumbnails: boolean;
  generateWebp: boolean;
  quality: number;
  autoOptimize: boolean;
}

// API response types for image operations
export interface UploadImageRequest {
  tour_id: string;
  image: TourImageUpload;
}

export interface UpdateImageOrderRequest {
  tour_id: string;
  image_orders: {
    image_id: string;
    display_order: number;
  }[];
}

export interface SetPrimaryImageRequest {
  tour_id: string;
  image_id: string;
}

// Image gallery types
export interface TourImageGallery {
  tour_id: string;
  images: TourImage[];
  total_count: number;
  primary_image?: TourImage;
}

export interface ImageLightboxData {
  images: TourImage[];
  currentIndex: number;
  tour_name: string;
  tour_id: string;
}

// Error types
export interface ImageError {
  code: string;
  message: string;
  image_url?: string;
  file_name?: string;
  field?: string;
}

export const IMAGE_ERROR_CODES = {
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TOO_SMALL: 'FILE_TOO_SMALL',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
  INVALID_PERMISSIONS: 'INVALID_PERMISSIONS',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED'
} as const;

// Export utility functions
export {
  sortImagesByOrder,
  getPrimaryImage,
  reorderImages,
  generateImageVariants,
  validateImageFile
};
