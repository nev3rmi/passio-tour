// Tour Management System - Image Upload Service
// Date: 2025-11-19 | Feature: Tour Management System MVP

import { Request } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { DatabaseManager } from '../database/DatabaseManager';
import { 
  TourImage, 
  TourImageCreate, 
  ImageValidationResult,
  ImageProcessingOptions,
  ImageUploadResponse,
  DeleteImageResponse
} from '../../../shared/types/tour-image';
import { logger } from '../utils/enhancedLogger';
import { ApiError } from '../middleware/apiResponse';

// Image upload configuration
const IMAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 800, height: 600 }
  },
  uploadDirectory: process.env.IMAGE_UPLOAD_PATH || './uploads/tours',
  tempDirectory: process.env.TEMP_UPLOAD_PATH || './uploads/temp'
};

export class ImageUploadService {
  private db: DatabaseManager;
  private readonly serviceName = 'ImageUploadService';

  constructor(db: DatabaseManager) {
    this.db = db;
    this.ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(IMAGE_CONFIG.uploadDirectory, { recursive: true });
      await fs.mkdir(IMAGE_CONFIG.tempDirectory, { recursive: true });
      await fs.mkdir(path.join(IMAGE_CONFIG.uploadDirectory, 'thumbnails'), { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directories', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate uploaded image file
   */
  validateImageFile(file: Express.Multer.File): ImageValidationResult {
    const validation: ImageValidationResult = {
      isValid: true,
      errors: []
    };

    // Check file size
    if (file.size > IMAGE_CONFIG.maxFileSize) {
      validation.isValid = false;
      validation.errors.push(`File size exceeds maximum limit of ${IMAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!IMAGE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      validation.isValid = false;
      validation.errors.push(`Invalid file type. Allowed types: ${IMAGE_CONFIG.allowedMimeTypes.join(', ')}`);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!IMAGE_CONFIG.allowedExtensions.includes(fileExtension)) {
      validation.isValid = false;
      validation.errors.push(`Invalid file extension. Allowed extensions: ${IMAGE_CONFIG.allowedExtensions.join(', ')}`);
    }

    return validation;
  }

  /**
   * Upload and process tour images
   */
  async uploadTourImages(
    tourId: string,
    files: Express.Multer.File[],
    options?: ImageProcessingOptions
  ): Promise<ImageUploadResponse> {
    const method = 'uploadTourImages';
    const correlationId = `image_upload_${tourId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('Starting tour image upload', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        fileCount: files.length
      });

      if (!files || files.length === 0) {
        throw new ApiError(400, 'NO_FILES_PROVIDED', 'No image files provided for upload');
      }

      // Validate all files
      const validationResults = files.map(file => this.validateImageFile(file));
      const invalidFiles = validationResults.filter(result => !result.isValid);
      
      if (invalidFiles.length > 0) {
        const allErrors = invalidFiles.flatMap(result => result.errors);
        throw new ApiError(400, 'INVALID_FILES', `Invalid files detected: ${allErrors.join('; ')}`);
      }

      const uploadedImages: TourImage[] = [];
      const errors: string[] = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const imageData = await this.processAndSaveImage(file, tourId, i);
          uploadedImages.push(imageData);
        } catch (error) {
          const errorMessage = `Failed to process ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          logger.error('Image processing failed', {
            service: this.serviceName,
            method,
            correlationId,
            fileName: file.originalname,
            error: errorMessage
          });
        }
      }

      // Save image records to database if any were processed successfully
      if (uploadedImages.length > 0) {
        await this.saveImageRecords(tourId, uploadedImages);
        
        // Set first image as primary if no primary image exists
        await this.ensurePrimaryImage(tourId, uploadedImages[0].id);
      }

      const response: ImageUploadResponse = {
        success: true,
        images: uploadedImages,
        uploadedCount: uploadedImages.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };

      logger.info('Tour image upload completed', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        uploadedCount: uploadedImages.length,
        failedCount: errors.length
      });

      return response;

    } catch (error) {
      logger.error('Failed to upload tour images', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'UPLOAD_FAILED', 'Failed to upload tour images', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Process and save a single image
   */
  private async processAndSaveImage(
    file: Express.Multer.File,
    tourId: string,
    index: number
  ): Promise<TourImage> {
    const imageId = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const baseFilename = `${imageId}_${Date.now()}`;
    
    // Create tour-specific directory
    const tourDirectory = path.join(IMAGE_CONFIG.uploadDirectory, tourId);
    await fs.mkdir(tourDirectory, { recursive: true });

    // Original file path
    const originalPath = path.join(tourDirectory, `${baseFilename}${fileExtension}`);

    // Save original file
    await fs.writeFile(originalPath, file.buffer);

    // Get image metadata
    const metadata = await sharp(file.buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to determine image dimensions');
    }

    // Generate thumbnails and different sizes
    const imageVariants = await this.generateImageVariants(
      file.buffer,
      baseFilename,
      tourDirectory,
      metadata
    );

    // Create image record
    const imageRecord: TourImage = {
      id: imageId,
      tourId,
      originalFilename: file.originalname,
      filename: `${baseFilename}${fileExtension}`,
      filePath: originalPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      imageType: index === 0 ? 'GALLERY' : 'GALLERY',
      status: 'ACTIVE',
      width: metadata.width,
      height: metadata.height,
      thumbnailUrl: imageVariants.thumbnail,
      mediumUrl: imageVariants.medium,
      largeUrl: imageVariants.large,
      processedAt: new Date(),
      sortOrder: index,
      views: 0,
      downloads: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return imageRecord;
  }

  /**
   * Generate different sizes and thumbnails for an image
   */
  private async generateImageVariants(
    imageBuffer: Buffer,
    baseFilename: string,
    directory: string,
    metadata: sharp.Metadata
  ): Promise<{
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    const variants = IMAGE_CONFIG.thumbnailSizes;
    const urls: { [key: string]: string } = {};

    // Generate thumbnail
    const thumbnailPath = path.join(directory, `${baseFilename}_thumb.jpg`);
    await sharp(imageBuffer)
      .resize(variants.small.width, variants.small.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    urls.thumbnail = thumbnailPath;

    // Generate medium size
    const mediumPath = path.join(directory, `${baseFilename}_medium.jpg`);
    await sharp(imageBuffer)
      .resize(variants.medium.width, variants.medium.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(mediumPath);
    urls.medium = mediumPath;

    // Generate large size
    const largePath = path.join(directory, `${baseFilename}_large.jpg`);
    await sharp(imageBuffer)
      .resize(variants.large.width, variants.large.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toFile(largePath);
    urls.large = largePath;

    return {
      thumbnail: urls.thumbnail,
      medium: urls.medium,
      large: urls.large
    };
  }

  /**
   * Save image records to database
   */
  private async saveImageRecords(tourId: string, images: TourImage[]): Promise<void> {
    const query = `
      INSERT INTO tour_images (
        id, tour_id, original_filename, filename, file_path, file_size, mime_type,
        image_type, status, width, height, thumbnail_url, medium_url, large_url,
        processed_at, sort_order, views, downloads, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
    `;

    for (const image of images) {
      await this.db.query(query, [
        image.id,
        image.tourId,
        image.originalFilename,
        image.filename,
        image.filePath,
        image.fileSize,
        image.mimeType,
        image.imageType,
        image.status,
        image.width,
        image.height,
        image.thumbnailUrl,
        image.mediumUrl,
        image.largeUrl,
        image.processedAt,
        image.sortOrder,
        image.views,
        image.downloads,
        image.createdAt,
        image.updatedAt
      ]);
    }
  }

  /**
   * Ensure at least one image is marked as primary
   */
  private async ensurePrimaryImage(tourId: string, imageId: string): Promise<void> {
    const query = `
      SELECT COUNT(*) as primary_count
      FROM tour_images
      WHERE tour_id = $1 AND is_primary = TRUE AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [tourId]);
    const primaryCount = parseInt(result.rows[0].primary_count);

    // If no primary image exists, set the first one as primary
    if (primaryCount === 0) {
      const updateQuery = `
        UPDATE tour_images
        SET is_primary = TRUE, updated_at = NOW()
        WHERE id = $1
      `;
      await this.db.query(updateQuery, [imageId]);
    }
  }

  /**
   * Delete tour image
   */
  async deleteTourImage(
    tourId: string,
    imageId: string
  ): Promise<DeleteImageResponse> {
    const method = 'deleteTourImage';
    const correlationId = `delete_image_${tourId}_${imageId}`;

    try {
      logger.info('Deleting tour image', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        imageId
      });

      // Get image details
      const imageQuery = `
        SELECT * FROM tour_images
        WHERE id = $1 AND tour_id = $2 AND deleted_at IS NULL
      `;

      const imageResult = await this.db.query(imageQuery, [imageId, tourId]);
      
      if (imageResult.rows.length === 0) {
        throw new ApiError(404, 'IMAGE_NOT_FOUND', 'Tour image not found');
      }

      const image = imageResult.rows[0];

      // Soft delete from database
      const updateQuery = `
        UPDATE tour_images
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `;
      await this.db.query(updateQuery, [imageId]);

      // Clean up file system (optional - can be done by cleanup job)
      try {
        await this.deleteImageFiles(image);
      } catch (fileError) {
        logger.warn('Failed to delete image files from filesystem', {
          service: this.serviceName,
          method,
          correlationId,
          imageId,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }

      const response: DeleteImageResponse = {
        success: true,
        imageId,
        message: 'Tour image deleted successfully'
      };

      logger.info('Tour image deleted successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        imageId
      });

      return response;

    } catch (error) {
      logger.error('Failed to delete tour image', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        imageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'DELETE_FAILED', 'Failed to delete tour image', error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Delete image files from filesystem
   */
  private async deleteImageFiles(image: any): Promise<void> {
    const filesToDelete = [
      image.file_path,
      image.thumbnail_url,
      image.medium_url,
      image.large_url
    ].filter(Boolean);

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Log but don't fail if file doesn't exist
        logger.debug('File deletion skipped (file not found)', { filePath });
      }
    }
  }

  /**
   * Reorder tour images
   */
  async reorderTourImages(
    tourId: string,
    imageIds: string[]
  ): Promise<{ success: boolean; message: string }> {
    const method = 'reorderTourImages';
    const correlationId = `reorder_images_${tourId}_${Date.now()}`;

    try {
      logger.info('Reordering tour images', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        imageCount: imageIds.length
      });

      // Update sort order for each image
      const updateQuery = `
        UPDATE tour_images
        SET sort_order = $1, updated_at = NOW()
        WHERE id = $2 AND tour_id = $3 AND deleted_at IS NULL
      `;

      for (let i = 0; i < imageIds.length; i++) {
        await this.db.query(updateQuery, [i, imageIds[i], tourId]);
      }

      logger.info('Tour images reordered successfully', {
        service: this.serviceName,
        method,
        correlationId,
        tourId
      });

      return {
        success: true,
        message: 'Tour images reordered successfully'
      };

    } catch (error) {
      logger.error('Failed to reorder tour images', {
        service: this.serviceName,
        method,
        correlationId,
        tourId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new ApiError(500, 'REORDER_FAILED', 'Failed to reorder tour images', error instanceof Error ? error.message : undefined);
    }
  }
}