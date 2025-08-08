// =============================================================================
// Solar Assessment Tool Screen
// =============================================================================
// Integrates camera, GPS, and sensors for comprehensive solar site assessment
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cameraService, PhotoCaptureResult } from '../../services/camera.service';
import { locationService, LocationCoordinates, SolarPotentialData } from '../../services/location.service';
import { sensorsService, RoofMeasurementData, SensorCapabilities } from '../../services/sensors.service';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { PhotoMetadata } from '../../types';

export interface SolarAssessmentToolProps {
  onBack?: () => void;
  onAssessmentComplete?: (assessment: SolarAssessmentData) => void;
}

export interface SolarAssessmentData {
  location: LocationCoordinates;
  address: string;
  photos: {
    roof_photos: PhotoMetadata[];
    electrical_panel: PhotoMetadata[];
    property_overview: PhotoMetadata[];
  };
  roof_measurements?: RoofMeasurementData;
  solar_potential?: SolarPotentialData;
  assessment_date: Date;
  assessment_id: string;
}

export const SolarAssessmentTool: React.FC<SolarAssessmentToolProps> = ({
  onBack,
  onAssessmentComplete,
}) => {
  const insets = useSafeAreaInsets();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Partial<SolarAssessmentData>>({
    photos: { roof_photos: [], electrical_panel: [], property_overview: [] },
    assessment_date: new Date(),
    assessment_id: `assessment_${Date.now()}`,
  });

  // Sensor and location state
  const [sensorCapabilities, setSensorCapabilities] = useState<SensorCapabilities>({
    accelerometer: false,
    gyroscope: false,
    magnetometer: false,
    orientation: false,
  });
  const [sensorsCalibrated, setSensorsCalibrated] = useState(false);
  const [measurementInProgress, setMeasurementInProgress] = useState(false);

  // Steps in the assessment process
  const assessmentSteps = [
    { id: 'location', title: 'Location', description: 'Get property location' },
    { id: 'roof_photos', title: 'Roof Photos', description: 'Capture roof images' },
    { id: 'measurements', title: 'Measurements', description: 'Measure roof orientation' },
    { id: 'electrical', title: 'Electrical Panel', description: 'Photo of electrical panel' },
    { id: 'solar_analysis', title: 'Solar Analysis', description: 'Calculate solar potential' },
    { id: 'review', title: 'Review', description: 'Review assessment data' },
  ];

  useEffect(() => {
    initializeAssessmentTool();
  }, []);

  const initializeAssessmentTool = async () => {
    try {
      setLoading(true);
      
      // Check sensor capabilities
      const capabilities = await sensorsService.checkSensorCapabilities();
      setSensorCapabilities(capabilities);
      
      // Initialize sensors if available
      if (capabilities.accelerometer && capabilities.magnetometer) {
        await sensorsService.startAccelerometer();
        await sensorsService.startMagnetometer();
      }

    } catch (error) {
      console.error('Failed to initialize assessment tool:', error);
      Alert.alert('Initialization Error', 'Some features may not be available');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Step 1: Get Location
  // =============================================================================

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      
      const location = await locationService.getCurrentLocation(true);
      const address = await locationService.reverseGeocode(location);
      
      setAssessmentData(prev => ({
        ...prev,
        location,
        address: address.formattedAddress || 'Unknown address',
      }));

      Alert.alert(
        'Location Captured',
        `Location: ${address.formattedAddress}\n\nAccuracy: ±${location.accuracy.toFixed(0)}m`,
        [{ text: 'Next Step', onPress: () => setCurrentStep(1) }]
      );
      
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location. Please ensure GPS is enabled.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Step 2: Capture Roof Photos
  // =============================================================================

  const handleCaptureRoofPhoto = async () => {
    try {
      setLoading(true);
      
      const result: PhotoCaptureResult = await cameraService.showPhotoOptions({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
      });

      if (result.success && result.photo) {
        // Validate photo for solar assessment
        const validation = cameraService.validatePhotoForSolar(result.photo, 'roof_photo');
        
        if (validation.warnings.length > 0) {
          const warningMessage = validation.warnings.join('\n\n');
          Alert.alert('Photo Quality Warning', warningMessage);
        }

        // Add photo to assessment data
        setAssessmentData(prev => ({
          ...prev,
          photos: {
            ...prev.photos!,
            roof_photos: [...(prev.photos?.roof_photos || []), result.photo!],
          },
        }));

        Alert.alert(
          'Photo Captured',
          `Roof photo ${(assessmentData.photos?.roof_photos?.length || 0) + 1} saved successfully.`,
          [
            { text: 'Add Another', onPress: () => handleCaptureRoofPhoto() },
            { text: 'Continue', onPress: () => setCurrentStep(2) },
          ]
        );
      } else if (result.cancelled) {
        // User cancelled, offer to continue or retry
        if ((assessmentData.photos?.roof_photos?.length || 0) > 0) {
          Alert.alert(
            'Continue Assessment?',
            'You can continue with the photos already captured or add more roof photos.',
            [
              { text: 'Add More Photos', onPress: () => handleCaptureRoofPhoto() },
              { text: 'Continue', onPress: () => setCurrentStep(2) },
            ]
          );
        }
      }
      
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to capture photo');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Step 3: Roof Measurements
  // =============================================================================

  const handleCalibrateSensors = async () => {
    try {
      setLoading(true);
      
      const calibrationResult = await sensorsService.calibrateSensors();
      
      if (calibrationResult.success) {
        setSensorsCalibrated(true);
        Alert.alert('Calibration Complete', calibrationResult.message);
      } else {
        Alert.alert('Calibration Failed', calibrationResult.message);
      }
      
    } catch (error) {
      Alert.alert('Calibration Error', 'Failed to calibrate sensors');
    } finally {
      setLoading(false);
    }
  };

  const handleMeasureRoof = async () => {
    if (!sensorsCalibrated) {
      Alert.alert('Calibration Required', 'Please calibrate the sensors first');
      return;
    }

    try {
      setMeasurementInProgress(true);
      
      Alert.alert(
        'Roof Measurement',
        'Place your device flat against the roof surface and keep it steady for 3 seconds.',
        [{ text: 'Start Measurement', onPress: startRoofMeasurement }]
      );
      
    } catch (error) {
      Alert.alert('Measurement Error', 'Failed to start roof measurement');
      setMeasurementInProgress(false);
    }
  };

  const startRoofMeasurement = async () => {
    try {
      const measurement = await sensorsService.measureRoofParameters(3000);
      const recommendations = sensorsService.getSolarRecommendations(measurement);
      
      setAssessmentData(prev => ({
        ...prev,
        roof_measurements: measurement,
      }));

      Alert.alert(
        'Measurement Complete',
        `Roof Tilt: ${measurement.tilt_angle.toFixed(1)}°\n` +
        `Orientation: ${measurement.azimuth_angle.toFixed(0)}°\n` +
        `Confidence: ${(measurement.confidence * 100).toFixed(0)}%\n\n` +
        `Rating: ${recommendations.azimuth_rating}`,
        [{ text: 'Next Step', onPress: () => setCurrentStep(3) }]
      );
      
    } catch (error) {
      Alert.alert('Measurement Failed', (error as Error).message);
    } finally {
      setMeasurementInProgress(false);
    }
  };

  // =============================================================================
  // Step 4: Electrical Panel Photo
  // =============================================================================

  const handleCaptureElectricalPanel = async () => {
    try {
      setLoading(true);
      
      const result: PhotoCaptureResult = await cameraService.showPhotoOptions({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.success && result.photo) {
        setAssessmentData(prev => ({
          ...prev,
          photos: {
            ...prev.photos!,
            electrical_panel: [result.photo!],
          },
        }));

        Alert.alert('Electrical Panel Photo Captured', 'Moving to solar analysis...');
        setCurrentStep(4);
      }
      
    } catch (error) {
      Alert.alert('Camera Error', 'Failed to capture electrical panel photo');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Step 5: Solar Analysis
  // =============================================================================

  const handleSolarAnalysis = async () => {
    try {
      setLoading(true);
      
      if (!assessmentData.location) {
        Alert.alert('Error', 'Location data is required for solar analysis');
        return;
      }

      const solarPotential = await locationService.getSolarPotential(assessmentData.location);
      
      setAssessmentData(prev => ({
        ...prev,
        solar_potential: solarPotential,
      }));

      Alert.alert(
        'Solar Analysis Complete',
        `Peak Sun Hours: ${solarPotential.solar_data.peak_sun_hours}\n` +
        `Annual Solar Irradiance: ${solarPotential.solar_data.solar_irradiance.toFixed(0)} kWh/m²\n` +
        `Optimal Tilt: ${solarPotential.solar_data.tilt_angle}°`,
        [{ text: 'Review Assessment', onPress: () => setCurrentStep(5) }]
      );
      
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to complete solar analysis');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // Step 6: Review and Complete
  // =============================================================================

  const handleCompleteAssessment = () => {
    const completeAssessment: SolarAssessmentData = {
      location: assessmentData.location!,
      address: assessmentData.address!,
      photos: assessmentData.photos!,
      roof_measurements: assessmentData.roof_measurements,
      solar_potential: assessmentData.solar_potential,
      assessment_date: assessmentData.assessment_date!,
      assessment_id: assessmentData.assessment_id!,
    };

    Alert.alert(
      'Assessment Complete',
      'Your solar site assessment has been completed successfully!',
      [
        { text: 'Save & Exit', onPress: () => onAssessmentComplete?.(completeAssessment) },
        { text: 'Review Again', style: 'cancel' },
      ]
    );
  };

  // =============================================================================
  // Render Methods
  // =============================================================================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {assessmentSteps.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index < currentStep && styles.completedStep,
            index === currentStep && styles.activeStep,
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= currentStep && styles.activeStepText,
            ]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepTitle,
            index === currentStep && styles.activeStepTitle,
          ]}>
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderLocationStep();
      case 1:
        return renderRoofPhotosStep();
      case 2:
        return renderMeasurementsStep();
      case 3:
        return renderElectricalStep();
      case 4:
        return renderSolarAnalysisStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        First, we need to determine the exact location of your property for accurate solar calculations.
      </Text>
      
      {assessmentData.location ? (
        <View style={styles.dataCard}>
          <Text style={styles.dataTitle}>Location Captured</Text>
          <Text style={styles.dataValue}>{assessmentData.address}</Text>
          <Text style={styles.dataSubtext}>
            Coordinates: {assessmentData.location.latitude.toFixed(6)}, {assessmentData.location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.dataSubtext}>
            Accuracy: ±{assessmentData.location.accuracy.toFixed(0)}m
          </Text>
        </View>
      ) : (
        <LoadingButton
          title="Get Current Location"
          onPress={handleGetLocation}
          loading={loading}
          style={styles.actionButton}
        />
      )}
    </View>
  );

  const renderRoofPhotosStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Take photos of your roof from different angles. These will be used for solar panel layout planning.
      </Text>
      
      <View style={styles.photoGrid}>
        {assessmentData.photos?.roof_photos?.map((photo, index) => (
          <View key={index} style={styles.photoItem}>
            <Text style={styles.photoLabel}>Roof Photo {index + 1}</Text>
            <Text style={styles.photoSize}>
              {(photo.size / 1024 / 1024).toFixed(1)} MB
            </Text>
          </View>
        ))}
      </View>
      
      <LoadingButton
        title={`Capture Roof Photo ${(assessmentData.photos?.roof_photos?.length || 0) + 1}`}
        onPress={handleCaptureRoofPhoto}
        loading={loading}
        style={styles.actionButton}
      />
      
      {(assessmentData.photos?.roof_photos?.length || 0) > 0 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.skipButtonText}>Continue with {assessmentData.photos?.roof_photos?.length} photos</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMeasurementsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Use your device's sensors to measure the roof's tilt angle and orientation for optimal solar panel placement.
      </Text>
      
      {!sensorCapabilities.accelerometer ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Device sensors not available. Measurements will be skipped.
          </Text>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setCurrentStep(3)}
          >
            <Text style={styles.skipButtonText}>Skip Measurements</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {!sensorsCalibrated && (
            <LoadingButton
              title="Calibrate Sensors"
              onPress={handleCalibrateSensors}
              loading={loading}
              style={styles.actionButton}
            />
          )}
          
          {sensorsCalibrated && !assessmentData.roof_measurements && (
            <LoadingButton
              title={measurementInProgress ? "Measuring..." : "Measure Roof"}
              onPress={handleMeasureRoof}
              loading={measurementInProgress}
              style={styles.actionButton}
            />
          )}
          
          {assessmentData.roof_measurements && (
            <View style={styles.dataCard}>
              <Text style={styles.dataTitle}>Roof Measurements</Text>
              <Text style={styles.dataValue}>
                Tilt: {assessmentData.roof_measurements.tilt_angle.toFixed(1)}°
              </Text>
              <Text style={styles.dataValue}>
                Orientation: {assessmentData.roof_measurements.azimuth_angle.toFixed(0)}°
              </Text>
              <Text style={styles.dataSubtext}>
                Confidence: {(assessmentData.roof_measurements.confidence * 100).toFixed(0)}%
              </Text>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderElectricalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Take a photo of your electrical panel to assess compatibility and available space for solar equipment.
      </Text>
      
      {assessmentData.photos?.electrical_panel?.length ? (
        <View style={styles.dataCard}>
          <Text style={styles.dataTitle}>Electrical Panel Photo Captured</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setCurrentStep(4)}
          >
            <Text style={styles.continueButtonText}>Continue to Analysis</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LoadingButton
          title="Capture Electrical Panel"
          onPress={handleCaptureElectricalPanel}
          loading={loading}
          style={styles.actionButton}
        />
      )}
    </View>
  );

  const renderSolarAnalysisStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Analyzing solar potential based on your location and measurements...
      </Text>
      
      {assessmentData.solar_potential ? (
        <View style={styles.dataCard}>
          <Text style={styles.dataTitle}>Solar Analysis Complete</Text>
          <Text style={styles.dataValue}>
            Peak Sun Hours: {assessmentData.solar_potential.solar_data.peak_sun_hours}
          </Text>
          <Text style={styles.dataValue}>
            Annual Irradiance: {assessmentData.solar_potential.solar_data.solar_irradiance.toFixed(0)} kWh/m²
          </Text>
          <Text style={styles.dataValue}>
            Optimal Tilt: {assessmentData.solar_potential.solar_data.tilt_angle}°
          </Text>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setCurrentStep(5)}
          >
            <Text style={styles.continueButtonText}>Review Assessment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LoadingButton
          title="Analyze Solar Potential"
          onPress={handleSolarAnalysis}
          loading={loading}
          style={styles.actionButton}
        />
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Review your solar site assessment data before completing.
      </Text>
      
      <ScrollView style={styles.reviewScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Location</Text>
          <Text style={styles.reviewText}>{assessmentData.address}</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Photos Captured</Text>
          <Text style={styles.reviewText}>
            Roof Photos: {assessmentData.photos?.roof_photos?.length || 0}
          </Text>
          <Text style={styles.reviewText}>
            Electrical Panel: {assessmentData.photos?.electrical_panel?.length || 0}
          </Text>
        </View>
        
        {assessmentData.roof_measurements && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Roof Measurements</Text>
            <Text style={styles.reviewText}>
              Tilt: {assessmentData.roof_measurements.tilt_angle.toFixed(1)}°
            </Text>
            <Text style={styles.reviewText}>
              Orientation: {assessmentData.roof_measurements.azimuth_angle.toFixed(0)}°
            </Text>
          </View>
        )}
        
        {assessmentData.solar_potential && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Solar Potential</Text>
            <Text style={styles.reviewText}>
              Peak Sun Hours: {assessmentData.solar_potential.solar_data.peak_sun_hours}
            </Text>
            <Text style={styles.reviewText}>
              Annual Irradiance: {assessmentData.solar_potential.solar_data.solar_irradiance.toFixed(0)} kWh/m²
            </Text>
          </View>
        )}
      </ScrollView>
      
      <LoadingButton
        title="Complete Assessment"
        onPress={handleCompleteAssessment}
        style={styles.completeButton}
      />
    </View>
  );

  if (loading && currentStep === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Solar Assessment Tool...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Solar Assessment</Text>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completedStep: {
    backgroundColor: '#34C759',
  },
  activeStep: {
    backgroundColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  activeStepText: {
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  activeStepTitle: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    marginVertical: 8,
  },
  dataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  dataSubtext: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
  },
  photoItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  photoSize: {
    fontSize: 10,
    color: '#666666',
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewScroll: {
    maxHeight: 300,
    marginVertical: 16,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  completeButton: {
    backgroundColor: '#34C759',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
});