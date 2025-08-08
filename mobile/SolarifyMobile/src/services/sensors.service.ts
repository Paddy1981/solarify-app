// =============================================================================
// Device Sensors Service for Mobile
// =============================================================================
// Handles device sensors like accelerometer, gyroscope, magnetometer for measurements
// =============================================================================

import { DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface GyroscopeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface MagnetometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface DeviceOrientationData {
  pitch: number;   // Rotation around X-axis (degrees)
  roll: number;    // Rotation around Y-axis (degrees)
  yaw: number;     // Rotation around Z-axis (degrees)
  azimuth: number; // Compass direction (degrees, 0 = north)
  timestamp: number;
}

export interface RoofMeasurementData {
  tilt_angle: number;      // Roof tilt in degrees
  azimuth_angle: number;   // Roof facing direction in degrees
  compass_bearing: number; // Magnetic compass bearing
  confidence: number;      // 0-1, measurement confidence
  timestamp: Date;
}

export interface SensorCapabilities {
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  orientation: boolean;
}

export class SensorsService {
  private static instance: SensorsService;
  
  // Sensor subscriptions
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private magnetometerSubscription: any = null;
  
  // Data storage
  private accelerometerData: AccelerometerData[] = [];
  private gyroscopeData: GyroscopeData[] = [];
  private magnetometerData: MagnetometerData[] = [];
  
  // Listeners
  private orientationListeners: Array<(data: DeviceOrientationData) => void> = [];
  private measurementListeners: Array<(data: RoofMeasurementData) => void> = [];
  
  // Calibration data
  private calibrationOffset = { x: 0, y: 0, z: 0 };
  private isCalibrated = false;

  static getInstance(): SensorsService {
    if (!SensorsService.instance) {
      SensorsService.instance = new SensorsService();
    }
    return SensorsService.instance;
  }

  /**
   * Check available sensor capabilities
   */
  async checkSensorCapabilities(): Promise<SensorCapabilities> {
    try {
      // In a real implementation, you would check actual sensor availability
      // For now, we'll assume most modern devices have these sensors
      return {
        accelerometer: true,
        gyroscope: true,
        magnetometer: true,
        orientation: true,
      };
    } catch (error) {
      console.error('Failed to check sensor capabilities:', error);
      return {
        accelerometer: false,
        gyroscope: false,
        magnetometer: false,
        orientation: false,
      };
    }
  }

  /**
   * Start accelerometer monitoring
   */
  startAccelerometer(updateInterval: number = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // This would integrate with react-native-sensors or similar library
        // For demo purposes, we'll simulate sensor data
        this.accelerometerSubscription = setInterval(() => {
          const data: AccelerometerData = {
            x: (Math.random() - 0.5) * 2, // -1 to 1 g
            y: (Math.random() - 0.5) * 2,
            z: 1 + (Math.random() - 0.5) * 0.2, // Around 1g for vertical
            timestamp: Date.now(),
          };
          
          this.accelerometerData.push(data);
          
          // Keep only last 100 readings
          if (this.accelerometerData.length > 100) {
            this.accelerometerData.shift();
          }
          
          this.updateOrientation();
        }, updateInterval);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start gyroscope monitoring
   */
  startGyroscope(updateInterval: number = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.gyroscopeSubscription = setInterval(() => {
          const data: GyroscopeData = {
            x: (Math.random() - 0.5) * 0.1, // rad/s
            y: (Math.random() - 0.5) * 0.1,
            z: (Math.random() - 0.5) * 0.1,
            timestamp: Date.now(),
          };
          
          this.gyroscopeData.push(data);
          
          if (this.gyroscopeData.length > 100) {
            this.gyroscopeData.shift();
          }
        }, updateInterval);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start magnetometer monitoring
   */
  startMagnetometer(updateInterval: number = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.magnetometerSubscription = setInterval(() => {
          const data: MagnetometerData = {
            x: Math.random() * 100 - 50, // μT (microtesla)
            y: Math.random() * 100 - 50,
            z: Math.random() * 100 - 50,
            timestamp: Date.now(),
          };
          
          this.magnetometerData.push(data);
          
          if (this.magnetometerData.length > 100) {
            this.magnetometerData.shift();
          }
          
          this.updateOrientation();
        }, updateInterval);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop all sensors
   */
  stopAllSensors(): void {
    if (this.accelerometerSubscription) {
      clearInterval(this.accelerometerSubscription);
      this.accelerometerSubscription = null;
    }
    
    if (this.gyroscopeSubscription) {
      clearInterval(this.gyroscopeSubscription);
      this.gyroscopeSubscription = null;
    }
    
    if (this.magnetometerSubscription) {
      clearInterval(this.magnetometerSubscription);
      this.magnetometerSubscription = null;
    }
  }

  /**
   * Calibrate device for accurate measurements
   */
  async calibrateSensors(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.accelerometerData.length < 10) {
        return {
          success: false,
          message: 'Not enough sensor data for calibration. Please wait a moment and try again.',
        };
      }

      // Calculate average readings for calibration
      const avgAccel = this.accelerometerData
        .slice(-20)
        .reduce(
          (sum, data) => ({
            x: sum.x + data.x,
            y: sum.y + data.y,
            z: sum.z + data.z,
          }),
          { x: 0, y: 0, z: 0 }
        );

      this.calibrationOffset = {
        x: avgAccel.x / 20,
        y: avgAccel.y / 20,
        z: avgAccel.z / 20 - 1, // Subtract 1g for gravity
      };

      this.isCalibrated = true;

      return {
        success: true,
        message: 'Device calibrated successfully. Place the device on the roof surface for accurate measurements.',
      };
    } catch (error) {
      console.error('Failed to calibrate sensors:', error);
      return {
        success: false,
        message: 'Calibration failed. Please try again.',
      };
    }
  }

  /**
   * Measure roof tilt and orientation
   */
  async measureRoofParameters(measurementDuration: number = 3000): Promise<RoofMeasurementData> {
    return new Promise((resolve, reject) => {
      if (!this.isCalibrated) {
        reject(new Error('Device not calibrated. Please calibrate first.'));
        return;
      }

      const measurements: DeviceOrientationData[] = [];
      
      const measurementInterval = setInterval(() => {
        const orientation = this.getCurrentOrientation();
        if (orientation) {
          measurements.push(orientation);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(measurementInterval);
        
        if (measurements.length < 10) {
          reject(new Error('Insufficient measurement data'));
          return;
        }

        // Calculate average measurements
        const avgMeasurements = measurements.reduce(
          (sum, measurement) => ({
            pitch: sum.pitch + measurement.pitch,
            roll: sum.roll + measurement.roll,
            yaw: sum.yaw + measurement.yaw,
            azimuth: sum.azimuth + measurement.azimuth,
          }),
          { pitch: 0, roll: 0, yaw: 0, azimuth: 0 }
        );

        const count = measurements.length;
        const avgPitch = avgMeasurements.pitch / count;
        const avgRoll = avgMeasurements.roll / count;
        const avgAzimuth = avgMeasurements.azimuth / count;

        // Calculate roof tilt (combining pitch and roll)
        const tiltAngle = Math.sqrt(avgPitch * avgPitch + avgRoll * avgRoll);
        
        // Calculate roof facing direction
        const azimuthAngle = this.normalizeAngle(avgAzimuth);
        
        // Calculate measurement confidence based on variance
        const variance = this.calculateVariance(measurements);
        const confidence = Math.max(0, Math.min(1, 1 - variance / 100));

        const result: RoofMeasurementData = {
          tilt_angle: Math.abs(tiltAngle),
          azimuth_angle: azimuthAngle,
          compass_bearing: avgAzimuth,
          confidence,
          timestamp: new Date(),
        };

        resolve(result);
      }, measurementDuration);
    });
  }

  /**
   * Get current device orientation
   */
  getCurrentOrientation(): DeviceOrientationData | null {
    if (this.accelerometerData.length === 0 || this.magnetometerData.length === 0) {
      return null;
    }

    const latestAccel = this.accelerometerData[this.accelerometerData.length - 1];
    const latestMagnet = this.magnetometerData[this.magnetometerData.length - 1];

    // Apply calibration offset
    const accelX = latestAccel.x - this.calibrationOffset.x;
    const accelY = latestAccel.y - this.calibrationOffset.y;
    const accelZ = latestAccel.z - this.calibrationOffset.z;

    // Calculate pitch and roll from accelerometer
    const pitch = Math.atan2(accelX, Math.sqrt(accelY * accelY + accelZ * accelZ)) * 180 / Math.PI;
    const roll = Math.atan2(accelY, Math.sqrt(accelX * accelX + accelZ * accelZ)) * 180 / Math.PI;

    // Calculate yaw (compass heading) from magnetometer
    const yaw = Math.atan2(latestMagnet.y, latestMagnet.x) * 180 / Math.PI;
    const azimuth = this.normalizeAngle(yaw);

    return {
      pitch,
      roll,
      yaw,
      azimuth,
      timestamp: latestAccel.timestamp,
    };
  }

  /**
   * Add orientation change listener
   */
  addOrientationListener(callback: (data: DeviceOrientationData) => void): () => void {
    this.orientationListeners.push(callback);
    
    return () => {
      const index = this.orientationListeners.indexOf(callback);
      if (index > -1) {
        this.orientationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add measurement listener
   */
  addMeasurementListener(callback: (data: RoofMeasurementData) => void): () => void {
    this.measurementListeners.push(callback);
    
    return () => {
      const index = this.measurementListeners.indexOf(callback);
      if (index > -1) {
        this.measurementListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get sensor data statistics
   */
  getSensorStats(): {
    accelerometer_samples: number;
    gyroscope_samples: number;
    magnetometer_samples: number;
    is_calibrated: boolean;
    last_measurement?: Date;
  } {
    return {
      accelerometer_samples: this.accelerometerData.length,
      gyroscope_samples: this.gyroscopeData.length,
      magnetometer_samples: this.magnetometerData.length,
      is_calibrated: this.isCalibrated,
    };
  }

  /**
   * Reset calibration and clear data
   */
  resetSensors(): void {
    this.accelerometerData = [];
    this.gyroscopeData = [];
    this.magnetometerData = [];
    this.calibrationOffset = { x: 0, y: 0, z: 0 };
    this.isCalibrated = false;
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private updateOrientation(): void {
    const orientation = this.getCurrentOrientation();
    
    if (orientation) {
      this.orientationListeners.forEach(listener => listener(orientation));
    }
  }

  private normalizeAngle(angle: number): number {
    // Normalize angle to 0-360 degrees
    let normalized = angle;
    while (normalized < 0) normalized += 360;
    while (normalized >= 360) normalized -= 360;
    return normalized;
  }

  private calculateVariance(measurements: DeviceOrientationData[]): number {
    if (measurements.length < 2) return 100;

    const avg = measurements.reduce(
      (sum, m) => sum + Math.abs(m.pitch) + Math.abs(m.roll),
      0
    ) / measurements.length;

    const variance = measurements.reduce(
      (sum, m) => {
        const diff = (Math.abs(m.pitch) + Math.abs(m.roll)) - avg;
        return sum + diff * diff;
      },
      0
    ) / measurements.length;

    return Math.sqrt(variance);
  }

  /**
   * Convert sensor measurements to solar panel recommendations
   */
  getSolarRecommendations(measurement: RoofMeasurementData): {
    optimal_tilt: number;
    current_tilt: number;
    tilt_adjustment_needed: number;
    azimuth_rating: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const { tilt_angle, azimuth_angle } = measurement;
    
    // Optimal tilt is typically equal to latitude, but we'll use 30° as a general optimum
    const optimalTilt = 30;
    const tiltDifference = Math.abs(tilt_angle - optimalTilt);
    
    // Rate azimuth (assuming northern hemisphere, south-facing is best)
    let azimuthRating: 'excellent' | 'good' | 'fair' | 'poor';
    const southFacing = 180;
    const azimuthDifference = Math.abs(azimuth_angle - southFacing);
    
    if (azimuthDifference <= 15) {
      azimuthRating = 'excellent';
    } else if (azimuthDifference <= 30) {
      azimuthRating = 'good';
    } else if (azimuthDifference <= 60) {
      azimuthRating = 'fair';
    } else {
      azimuthRating = 'poor';
    }
    
    const recommendations: string[] = [];
    
    if (tiltDifference > 10) {
      recommendations.push(`Consider tilting panels ${tilt_angle < optimalTilt ? 'up' : 'down'} by ${tiltDifference.toFixed(0)}° for optimal performance`);
    }
    
    if (azimuthRating === 'poor') {
      recommendations.push('This roof orientation may significantly reduce solar production. Consider alternative roof surfaces or ground-mounted systems.');
    } else if (azimuthRating === 'fair') {
      recommendations.push('This roof orientation is acceptable but not optimal. Consider adjustable mounting systems if possible.');
    }
    
    if (measurement.confidence < 0.7) {
      recommendations.push('Measurement confidence is low. Consider taking additional measurements for better accuracy.');
    }
    
    return {
      optimal_tilt: optimalTilt,
      current_tilt: tilt_angle,
      tilt_adjustment_needed: tiltDifference,
      azimuth_rating: azimuthRating,
      recommendations,
    };
  }
}

// Export singleton instance
export const sensorsService = SensorsService.getInstance();