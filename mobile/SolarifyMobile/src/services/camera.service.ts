// =============================================================================
// Camera Service for Mobile
// =============================================================================
// Handles camera operations, photo capture, and image processing for solar assessments
// =============================================================================

import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { PhotoMetadata } from '../types';

export interface CameraOptions {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
  includeExtra?: boolean;
  storageOptions?: {
    skipBackup?: boolean;
    path?: string;
    cameraRoll?: boolean;
    waitUntilSaved?: boolean;
  };
}

export interface CameraPermissions {
  camera: boolean;
  storage: boolean;
  location?: boolean;
}

export interface PhotoCaptureResult {
  success: boolean;
  photo?: PhotoMetadata;
  error?: string;
  cancelled?: boolean;
}

export interface PhotoProcessingOptions {
  resize?: {
    width: number;
    height: number;
    quality?: number;
  };
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  metadata?: {
    location?: boolean;
    timestamp?: boolean;
    purpose?: string;
  };
}

export class CameraService {
  private static instance: CameraService;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Check and request camera permissions
   */
  async checkCameraPermissions(): Promise<CameraPermissions> {
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are handled by react-native-image-picker automatically
        return {
          camera: true,
          storage: true,
        };
      } else {
        // Android permissions
        const cameraPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        const storagePermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );

        return {
          camera: cameraPermission,
          storage: storagePermission,
        };
      }
    } catch (error) {
      console.error('Failed to check camera permissions:', error);
      return { camera: false, storage: false };
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<CameraPermissions> {
    try {
      if (Platform.OS === 'ios') {
        return { camera: true, storage: true };
      } else {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        return {
          camera: granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED,
          storage: granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED,
        };
      }
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return { camera: false, storage: false };
    }
  }

  /**
   * Capture photo using camera
   */
  async capturePhoto(options?: CameraOptions): Promise<PhotoCaptureResult> {
    try {
      // Check permissions
      const permissions = await this.checkCameraPermissions();
      
      if (!permissions.camera) {
        const requestedPermissions = await this.requestCameraPermissions();
        if (!requestedPermissions.camera) {
          return {
            success: false,
            error: 'Camera permission not granted',
          };
        }
      }

      const defaultOptions: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
        includeBase64: false,
        includeExtra: true,
        storageOptions: {
          skipBackup: true,
          cameraRoll: false,
          waitUntilSaved: true,
        },
        ...options,
      };

      return new Promise((resolve) => {
        launchCamera(defaultOptions, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve({
              success: false,
              cancelled: true,
            });
            return;
          }

          if (response.errorMessage) {
            resolve({
              success: false,
              error: response.errorMessage,
            });
            return;
          }

          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            
            const photo: PhotoMetadata = {
              uri: asset.uri!,
              width: asset.width || 0,
              height: asset.height || 0,
              size: asset.fileSize || 0,
              type: (asset.type || 'image/jpeg') as any,
              timestamp: new Date(),
              gps_location: asset.exif?.GPSLatitude && asset.exif?.GPSLongitude ? {
                latitude: this.parseGPSCoordinate(asset.exif.GPSLatitude, asset.exif.GPSLatitudeRef),
                longitude: this.parseGPSCoordinate(asset.exif.GPSLongitude, asset.exif.GPSLongitudeRef),
                accuracy: 10, // Default accuracy
              } : undefined,
            };

            resolve({
              success: true,
              photo,
            });
          } else {
            resolve({
              success: false,
              error: 'No photo captured',
            });
          }
        });
      });
    } catch (error) {
      console.error('Failed to capture photo:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Select photo from gallery
   */
  async selectFromGallery(options?: CameraOptions): Promise<PhotoCaptureResult> {
    try {
      const defaultOptions: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
        includeBase64: false,
        includeExtra: true,
        ...options,
      };

      return new Promise((resolve) => {
        launchImageLibrary(defaultOptions, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve({
              success: false,
              cancelled: true,
            });
            return;
          }

          if (response.errorMessage) {
            resolve({
              success: false,
              error: response.errorMessage,
            });
            return;
          }

          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            
            const photo: PhotoMetadata = {
              uri: asset.uri!,
              width: asset.width || 0,
              height: asset.height || 0,
              size: asset.fileSize || 0,
              type: (asset.type || 'image/jpeg') as any,
              timestamp: new Date(),
            };

            resolve({
              success: true,
              photo,
            });
          } else {
            resolve({
              success: false,
              error: 'No photo selected',
            });
          }
        });
      });
    } catch (error) {
      console.error('Failed to select photo from gallery:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Show photo selection options
   */
  async showPhotoOptions(options?: CameraOptions): Promise<PhotoCaptureResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve({ success: false, cancelled: true }) },
          { 
            text: 'Camera', 
            onPress: async () => {
              const result = await this.capturePhoto(options);
              resolve(result);
            }
          },
          { 
            text: 'Gallery', 
            onPress: async () => {
              const result = await this.selectFromGallery(options);
              resolve(result);
            }
          },
        ]
      );
    });
  }

  /**
   * Process captured photo with various enhancements
   */
  async processPhoto(
    photo: PhotoMetadata, 
    processingOptions?: PhotoProcessingOptions
  ): Promise<PhotoMetadata> {
    try {
      let processedPhoto = { ...photo };

      // Add timestamp watermark if requested
      if (processingOptions?.watermark) {
        processedPhoto = await this.addWatermark(processedPhoto, processingOptions.watermark);
      }

      // Resize if requested
      if (processingOptions?.resize) {
        processedPhoto = await this.resizePhoto(processedPhoto, processingOptions.resize);
      }

      // Add metadata
      if (processingOptions?.metadata) {
        if (processingOptions.metadata.timestamp) {
          processedPhoto.timestamp = new Date();
        }
      }

      return processedPhoto;
    } catch (error) {
      console.error('Failed to process photo:', error);
      return photo; // Return original photo if processing fails
    }
  }

  /**
   * Validate photo for solar assessment
   */
  validatePhotoForSolar(photo: PhotoMetadata, purpose: string): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check file size (should be reasonable for upload)
    if (photo.size > 10 * 1024 * 1024) { // 10MB
      warnings.push('Photo is very large and may take time to upload');
      suggestions.push('Consider using a lower quality setting');
    }

    // Check resolution based on purpose
    if (purpose === 'roof_photo') {
      if (photo.width < 1080 || photo.height < 1080) {
        warnings.push('Low resolution may affect solar panel layout accuracy');
        suggestions.push('Try to capture photos at higher resolution for better analysis');
      }
    }

    // Check for GPS location for roof photos
    if (purpose === 'roof_photo' && !photo.gps_location) {
      warnings.push('No location data found in photo');
      suggestions.push('Enable location services for more accurate solar calculations');
    }

    // Check aspect ratio for certain purposes
    if (purpose === 'electrical_panel') {
      const aspectRatio = photo.width / photo.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        suggestions.push('Try to capture the electrical panel in a more square format');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }

  /**
   * Get photo file info
   */
  async getPhotoInfo(uri: string): Promise<{
    exists: boolean;
    size: number;
    modifiedTime?: Date;
  }> {
    try {
      const exists = await RNFS.exists(uri);
      
      if (!exists) {
        return { exists: false, size: 0 };
      }

      const stats = await RNFS.stat(uri);
      
      return {
        exists: true,
        size: stats.size,
        modifiedTime: new Date(stats.mtime),
      };
    } catch (error) {
      console.error('Failed to get photo info:', error);
      return { exists: false, size: 0 };
    }
  }

  /**
   * Delete photo file
   */
  async deletePhoto(uri: string): Promise<boolean> {
    try {
      const exists = await RNFS.exists(uri);
      
      if (exists) {
        await RNFS.unlink(uri);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete photo:', error);
      return false;
    }
  }

  /**
   * Copy photo to app directory
   */
  async copyPhotoToAppDirectory(photo: PhotoMetadata, subDirectory: string): Promise<PhotoMetadata> {
    try {
      const appDirectory = RNFS.DocumentDirectoryPath;
      const targetDirectory = `${appDirectory}/${subDirectory}`;
      
      // Ensure directory exists
      await RNFS.mkdir(targetDirectory);
      
      const fileName = `photo_${Date.now()}.jpg`;
      const targetPath = `${targetDirectory}/${fileName}`;
      
      await RNFS.copyFile(photo.uri, targetPath);
      
      return {
        ...photo,
        uri: targetPath,
      };
    } catch (error) {
      console.error('Failed to copy photo to app directory:', error);
      throw error;
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private parseGPSCoordinate(coordinate: any, ref: string): number {
    if (!coordinate || !ref) return 0;
    
    let decimal = coordinate;
    
    // Handle coordinate in degrees/minutes/seconds format
    if (Array.isArray(coordinate) && coordinate.length >= 3) {
      decimal = coordinate[0] + coordinate[1] / 60 + coordinate[2] / 3600;
    }
    
    // Apply reference (N/S, E/W)
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }

  private async addWatermark(
    photo: PhotoMetadata, 
    watermarkOptions: { text: string; position: string }
  ): Promise<PhotoMetadata> {
    // This is a placeholder for watermark functionality
    // In a real implementation, you would use a library like react-native-image-editor
    // or implement native watermarking
    console.log(`Adding watermark "${watermarkOptions.text}" to photo`);
    return photo;
  }

  private async resizePhoto(
    photo: PhotoMetadata, 
    resizeOptions: { width: number; height: number; quality?: number }
  ): Promise<PhotoMetadata> {
    // This is a placeholder for resize functionality
    // In a real implementation, you would use a library like react-native-image-resizer
    console.log(`Resizing photo to ${resizeOptions.width}x${resizeOptions.height}`);
    
    return {
      ...photo,
      width: resizeOptions.width,
      height: resizeOptions.height,
    };
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();