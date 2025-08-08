// =============================================================================
// Camera Service Unit Tests
// =============================================================================
// Tests for camera functionality, photo capture, and validation
// =============================================================================

import { cameraService, PhotoCaptureResult } from '../../src/services/camera.service';
import { PhotoMetadata } from '../../src/types';

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  PermissionsAndroid: {
    PERMISSIONS: {
      CAMERA: 'android.permission.CAMERA',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
    check: jest.fn(),
    requestMultiple: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  exists: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn(),
  copyFile: jest.fn(),
}));

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';

const mockLaunchCamera = launchCamera as jest.MockedFunction<typeof launchCamera>;
const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;
const mockPermissionsCheck = PermissionsAndroid.check as jest.MockedFunction<typeof PermissionsAndroid.check>;
const mockPermissionsRequest = PermissionsAndroid.requestMultiple as jest.MockedFunction<typeof PermissionsAndroid.requestMultiple>;

describe('CameraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkCameraPermissions', () => {
    it('should return true for iOS permissions', async () => {
      const permissions = await cameraService.checkCameraPermissions();
      
      expect(permissions.camera).toBe(true);
      expect(permissions.storage).toBe(true);
    });

    it('should check Android permissions correctly', async () => {
      // Mock Android platform
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android' },
      }));

      mockPermissionsCheck
        .mockResolvedValueOnce(true)  // Camera permission
        .mockResolvedValueOnce(true); // Storage permission

      const permissions = await cameraService.checkCameraPermissions();
      
      expect(permissions.camera).toBe(true);
      expect(permissions.storage).toBe(true);
    });
  });

  describe('capturePhoto', () => {
    const mockPhotoAsset = {
      uri: 'file://test-photo.jpg',
      width: 1920,
      height: 1080,
      fileSize: 1024000,
      type: 'image/jpeg',
      exif: {
        GPSLatitude: 40.7128,
        GPSLatitudeRef: 'N',
        GPSLongitude: -74.0060,
        GPSLongitudeRef: 'W',
      },
    };

    it('should capture photo successfully', async () => {
      mockLaunchCamera.mockImplementationOnce((options, callback) => {
        callback({
          assets: [mockPhotoAsset],
        });
      });

      const result: PhotoCaptureResult = await cameraService.capturePhoto();

      expect(result.success).toBe(true);
      expect(result.photo).toBeDefined();
      expect(result.photo!.uri).toBe('file://test-photo.jpg');
      expect(result.photo!.width).toBe(1920);
      expect(result.photo!.height).toBe(1080);
      expect(result.photo!.gps_location).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      });
    });

    it('should handle user cancellation', async () => {
      mockLaunchCamera.mockImplementationOnce((options, callback) => {
        callback({
          didCancel: true,
        });
      });

      const result: PhotoCaptureResult = await cameraService.capturePhoto();

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });

    it('should handle camera errors', async () => {
      mockLaunchCamera.mockImplementationOnce((options, callback) => {
        callback({
          errorMessage: 'Camera not available',
        });
      });

      const result: PhotoCaptureResult = await cameraService.capturePhoto();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera not available');
    });

    it('should request permissions if not granted', async () => {
      mockPermissionsCheck.mockResolvedValue(false);
      mockPermissionsRequest.mockResolvedValue({
        'android.permission.CAMERA': 'granted',
        'android.permission.WRITE_EXTERNAL_STORAGE': 'granted',
      });

      mockLaunchCamera.mockImplementationOnce((options, callback) => {
        callback({
          assets: [mockPhotoAsset],
        });
      });

      const result = await cameraService.capturePhoto();

      expect(mockPermissionsRequest).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('selectFromGallery', () => {
    it('should select photo from gallery successfully', async () => {
      const mockGalleryAsset = {
        uri: 'file://gallery-photo.jpg',
        width: 1920,
        height: 1080,
        fileSize: 2048000,
        type: 'image/jpeg',
      };

      mockLaunchImageLibrary.mockImplementationOnce((options, callback) => {
        callback({
          assets: [mockGalleryAsset],
        });
      });

      const result = await cameraService.selectFromGallery();

      expect(result.success).toBe(true);
      expect(result.photo!.uri).toBe('file://gallery-photo.jpg');
    });
  });

  describe('validatePhotoForSolar', () => {
    const createMockPhoto = (overrides: Partial<PhotoMetadata> = {}): PhotoMetadata => ({
      uri: 'file://test-photo.jpg',
      width: 1920,
      height: 1080,
      size: 1024000,
      type: 'image/jpeg',
      timestamp: new Date(),
      ...overrides,
    });

    it('should validate roof photo correctly', () => {
      const photo = createMockPhoto({
        width: 1920,
        height: 1080,
        size: 2 * 1024 * 1024, // 2MB
        gps_location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      });

      const validation = cameraService.validatePhotoForSolar(photo, 'roof_photo');

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn about low resolution roof photos', () => {
      const photo = createMockPhoto({
        width: 640,
        height: 480,
      });

      const validation = cameraService.validatePhotoForSolar(photo, 'roof_photo');

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Low resolution may affect solar panel layout accuracy');
      expect(validation.suggestions).toContain('Try to capture photos at higher resolution for better analysis');
    });

    it('should warn about missing GPS location', () => {
      const photo = createMockPhoto({
        gps_location: undefined,
      });

      const validation = cameraService.validatePhotoForSolar(photo, 'roof_photo');

      expect(validation.warnings).toContain('No location data found in photo');
      expect(validation.suggestions).toContain('Enable location services for more accurate solar calculations');
    });

    it('should warn about large file size', () => {
      const photo = createMockPhoto({
        size: 15 * 1024 * 1024, // 15MB
      });

      const validation = cameraService.validatePhotoForSolar(photo, 'roof_photo');

      expect(validation.warnings).toContain('Photo is very large and may take time to upload');
      expect(validation.suggestions).toContain('Consider using a lower quality setting');
    });
  });

  describe('getPhotoInfo', () => {
    it('should return photo information when file exists', async () => {
      const mockStats = {
        size: 1024000,
        mtime: '2024-01-01T10:00:00Z',
      };

      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.stat as jest.Mock).mockResolvedValue(mockStats);

      const info = await cameraService.getPhotoInfo('file://test-photo.jpg');

      expect(info.exists).toBe(true);
      expect(info.size).toBe(1024000);
      expect(info.modifiedTime).toEqual(new Date(mockStats.mtime));
    });

    it('should handle non-existent files', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const info = await cameraService.getPhotoInfo('file://non-existent.jpg');

      expect(info.exists).toBe(false);
      expect(info.size).toBe(0);
    });
  });

  describe('deletePhoto', () => {
    it('should delete existing photo successfully', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await cameraService.deletePhoto('file://test-photo.jpg');

      expect(result).toBe(true);
      expect(RNFS.unlink).toHaveBeenCalledWith('file://test-photo.jpg');
    });

    it('should return false for non-existent files', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const result = await cameraService.deletePhoto('file://non-existent.jpg');

      expect(result).toBe(false);
      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });

  describe('copyPhotoToAppDirectory', () => {
    it('should copy photo to app directory successfully', async () => {
      const photo: PhotoMetadata = {
        uri: 'file://external/photo.jpg',
        width: 1920,
        height: 1080,
        size: 1024000,
        type: 'image/jpeg',
        timestamp: new Date(),
      };

      (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);

      const result = await cameraService.copyPhotoToAppDirectory(photo, 'rfq_photos');

      expect(RNFS.mkdir).toHaveBeenCalledWith('/documents/rfq_photos');
      expect(RNFS.copyFile).toHaveBeenCalledWith(
        'file://external/photo.jpg',
        expect.stringMatching(/\/documents\/rfq_photos\/photo_\d+\.jpg/)
      );
      expect(result.uri).toMatch(/\/documents\/rfq_photos\/photo_\d+\.jpg/);
    });
  });
});