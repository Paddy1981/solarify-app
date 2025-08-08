// =============================================================================
// Location Service for Mobile
// =============================================================================
// Handles GPS location, address geocoding, and solar potential calculations
// =============================================================================

import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface LocationPermissions {
  granted: boolean;
  whenInUse: boolean;
  always: boolean;
  denied: boolean;
  message?: string;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface SolarPotentialData {
  coordinates: LocationCoordinates;
  address: AddressInfo;
  solar_data: {
    peak_sun_hours: number;
    solar_irradiance: number; // kWh/m²/year
    tilt_angle: number; // Optimal tilt for location
    azimuth_angle: number; // Optimal azimuth (0 = north, 180 = south)
    shading_factor: number; // 0-1, lower is less shading
  };
  utility_info?: {
    company: string;
    rate_structure: 'tiered' | 'time_of_use' | 'flat';
    average_rate: number; // $/kWh
  };
}

export interface LocationWatchOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentLocation: LocationCoordinates | null = null;
  private locationListeners: Array<(location: LocationCoordinates) => void> = [];

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Check location permissions
   */
  async checkLocationPermissions(): Promise<LocationPermissions> {
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions need to be checked using Geolocation
        return new Promise((resolve) => {
          Geolocation.requestAuthorization();
          resolve({
            granted: true, // We'll assume granted for now
            whenInUse: true,
            always: false,
            denied: false,
          });
        });
      } else {
        // Android permissions
        const fineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        const coarseLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        return {
          granted: fineLocationGranted || coarseLocationGranted,
          whenInUse: fineLocationGranted || coarseLocationGranted,
          always: false,
          denied: !fineLocationGranted && !coarseLocationGranted,
        };
      }
    } catch (error) {
      console.error('Failed to check location permissions:', error);
      return {
        granted: false,
        whenInUse: false,
        always: false,
        denied: true,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions(): Promise<LocationPermissions> {
    try {
      if (Platform.OS === 'ios') {
        return new Promise((resolve) => {
          Geolocation.requestAuthorization();
          
          // Check authorization status after request
          Geolocation.getCurrentPosition(
            () => {
              resolve({
                granted: true,
                whenInUse: true,
                always: false,
                denied: false,
                message: 'iOS location permission granted',
              });
            },
            (error) => {
              resolve({
                granted: false,
                whenInUse: false,
                always: false,
                denied: true,
                message: error.message,
              });
            },
            { enableHighAccuracy: false, timeout: 5000 }
          );
        });
      } else {
        // Android permissions
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Solarify Location Permission',
            message: 'Solarify needs location access to provide accurate solar calculations and find nearby installers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

        return {
          granted: isGranted,
          whenInUse: isGranted,
          always: false,
          denied: !isGranted,
          message: isGranted 
            ? 'Android location permission granted'
            : 'Android location permission denied',
        };
      }
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return {
        granted: false,
        whenInUse: false,
        always: false,
        denied: true,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(highAccuracy: boolean = true): Promise<LocationCoordinates> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check permissions first
        const permissions = await this.checkLocationPermissions();
        
        if (!permissions.granted) {
          const requestedPermissions = await this.requestLocationPermissions();
          if (!requestedPermissions.granted) {
            reject(new Error('Location permission not granted'));
            return;
          }
        }

        const options = {
          enableHighAccuracy: highAccuracy,
          timeout: 15000,
          maximumAge: 10000,
        };

        Geolocation.getCurrentPosition(
          (position) => {
            const location: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
              timestamp: new Date(position.timestamp),
            };

            this.currentLocation = location;
            this.cacheLocation(location);
            resolve(location);
          },
          (error) => {
            console.error('Failed to get current location:', error);
            reject(new Error(`Location error: ${error.message}`));
          },
          options
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start watching location changes
   */
  startLocationWatch(
    callback: (location: LocationCoordinates) => void,
    options?: Partial<LocationWatchOptions>
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check permissions
        const permissions = await this.checkLocationPermissions();
        if (!permissions.granted) {
          reject(new Error('Location permission not granted'));
          return;
        }

        const watchOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
          distanceFilter: 10, // meters
          ...options,
        };

        const watchId = Geolocation.watchPosition(
          (position) => {
            const location: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
              timestamp: new Date(position.timestamp),
            };

            this.currentLocation = location;
            callback(location);
            
            // Notify all listeners
            this.locationListeners.forEach(listener => listener(location));
          },
          (error) => {
            console.error('Location watch error:', error);
          },
          watchOptions
        );

        this.watchId = watchId;
        resolve(watchId);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop watching location changes
   */
  stopLocationWatch(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Add location change listener
   */
  addLocationListener(callback: (location: LocationCoordinates) => void): () => void {
    this.locationListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.locationListeners.indexOf(callback);
      if (index > -1) {
        this.locationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get cached location
   */
  async getCachedLocation(): Promise<LocationCoordinates | null> {
    try {
      const cachedLocationString = await AsyncStorage.getItem('cached_location');
      
      if (cachedLocationString) {
        const cachedLocation = JSON.parse(cachedLocationString);
        return {
          ...cachedLocation,
          timestamp: new Date(cachedLocation.timestamp),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: LocationCoordinates): Promise<AddressInfo> {
    try {
      // This would typically use a geocoding service like Google Maps API
      // For demo purposes, we'll simulate the response
      console.log(`Reverse geocoding coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock address data - in production, you would call an actual geocoding API
      const mockAddress: AddressInfo = {
        street: '123 Solar Street',
        city: 'Sunnydale',
        state: 'CA',
        country: 'United States',
        postalCode: '94102',
        formattedAddress: '123 Solar Street, Sunnydale, CA 94102, United States',
      };

      return mockAddress;
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      throw new Error('Geocoding failed');
    }
  }

  /**
   * Forward geocode address to coordinates
   */
  async forwardGeocode(address: string): Promise<LocationCoordinates> {
    try {
      console.log(`Forward geocoding address: ${address}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coordinates - in production, you would call an actual geocoding API
      const mockCoordinates: LocationCoordinates = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        timestamp: new Date(),
      };

      return mockCoordinates;
    } catch (error) {
      console.error('Failed to forward geocode:', error);
      throw new Error('Address lookup failed');
    }
  }

  /**
   * Get solar potential data for location
   */
  async getSolarPotential(coordinates: LocationCoordinates): Promise<SolarPotentialData> {
    try {
      // Get address info
      const address = await this.reverseGeocode(coordinates);
      
      // Calculate solar potential based on location
      const solarData = this.calculateSolarPotential(coordinates);
      
      // Get utility information (mock data)
      const utilityInfo = await this.getUtilityInfo(coordinates);
      
      return {
        coordinates,
        address,
        solar_data: solarData,
        utility_info: utilityInfo,
      };
    } catch (error) {
      console.error('Failed to get solar potential:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(coord2.latitude - coord1.latitude);
    const dLon = this.degreesToRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(coord1.latitude)) *
      Math.cos(this.degreesToRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Get current location or cached location
   */
  async getLocationOrCached(): Promise<LocationCoordinates> {
    try {
      // Try to get current location first
      return await this.getCurrentLocation();
    } catch (error) {
      console.log('Failed to get current location, trying cached location');
      
      // Fall back to cached location
      const cachedLocation = await this.getCachedLocation();
      
      if (cachedLocation) {
        return cachedLocation;
      }
      
      throw new Error('No location available');
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private async cacheLocation(location: LocationCoordinates): Promise<void> {
    try {
      await AsyncStorage.setItem('cached_location', JSON.stringify(location));
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  private calculateSolarPotential(coordinates: LocationCoordinates) {
    // Simplified solar potential calculation based on latitude
    const { latitude } = coordinates;
    
    // Peak sun hours vary by latitude (simplified calculation)
    let peakSunHours: number;
    const absLatitude = Math.abs(latitude);
    
    if (absLatitude < 25) {
      peakSunHours = 5.5; // Tropical regions
    } else if (absLatitude < 35) {
      peakSunHours = 5.0; // Subtropical regions
    } else if (absLatitude < 45) {
      peakSunHours = 4.5; // Temperate regions
    } else {
      peakSunHours = 4.0; // Higher latitude regions
    }
    
    // Solar irradiance (simplified - in reality this would come from weather data)
    const solarIrradiance = peakSunHours * 365; // kWh/m²/year
    
    // Optimal tilt angle (rough approximation)
    const tiltAngle = Math.min(Math.max(Math.abs(latitude), 15), 40);
    
    // Optimal azimuth (180 = south for northern hemisphere, 0 = north for southern)
    const azimuthAngle = latitude >= 0 ? 180 : 0;
    
    // Assume minimal shading for now
    const shadingFactor = 0.95;
    
    return {
      peak_sun_hours: peakSunHours,
      solar_irradiance: solarIrradiance,
      tilt_angle: tiltAngle,
      azimuth_angle: azimuthAngle,
      shading_factor: shadingFactor,
    };
  }

  private async getUtilityInfo(coordinates: LocationCoordinates) {
    // Mock utility information - in production, this would come from a utility database
    return {
      company: 'Pacific Gas & Electric',
      rate_structure: 'time_of_use' as const,
      average_rate: 0.24, // $/kWh
    };
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get current location if available
   */
  getCurrentLocationSync(): LocationCoordinates | null {
    return this.currentLocation;
  }

  /**
   * Clear cached location
   */
  async clearCachedLocation(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cached_location');
      this.currentLocation = null;
    } catch (error) {
      console.error('Failed to clear cached location:', error);
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();