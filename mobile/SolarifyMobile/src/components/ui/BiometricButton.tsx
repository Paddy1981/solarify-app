// =============================================================================
// Biometric Authentication Button Component
// =============================================================================
// Specialized button for Touch ID, Face ID, and Android biometric authentication
// =============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from 'react-native';

export interface BiometricButtonProps {
  biometricType: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const BiometricButton: React.FC<BiometricButtonProps> = ({
  biometricType,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'medium',
  variant = 'primary',
}) => {
  const isDisabled = loading || disabled;
  const buttonConfig = getBiometricButtonConfig(biometricType);

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  const iconStyles = [
    styles.icon,
    styles[`${size}Icon`],
    { color: getIconColor(variant) },
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={getSpinnerColor(variant)} 
            style={styles.spinner}
          />
        ) : (
          <Text style={iconStyles}>{buttonConfig.icon}</Text>
        )}
        
        <View style={styles.textContainer}>
          <Text style={textStyles}>
            {loading ? 'Authenticating...' : `Sign in with ${biometricType}`}
          </Text>
          {!loading && (
            <Text style={[styles.subtitle, { color: getSubtitleColor(variant) }]}>
              {buttonConfig.subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface BiometricButtonConfig {
  icon: string;
  subtitle: string;
}

const getBiometricButtonConfig = (biometricType: string): BiometricButtonConfig => {
  switch (biometricType.toLowerCase()) {
    case 'touch id':
      return {
        icon: '👆',
        subtitle: 'Place your finger on the sensor',
      };
    case 'face id':
      return {
        icon: '👤',
        subtitle: 'Look at the camera',
      };
    case 'fingerprint':
      return {
        icon: '🔐',
        subtitle: 'Use your fingerprint',
      };
    case 'face recognition':
      return {
        icon: '🔍',
        subtitle: 'Use face recognition',
      };
    case 'iris recognition':
      return {
        icon: '👁️',
        subtitle: 'Use iris recognition',
      };
    default:
      return {
        icon: '🔒',
        subtitle: 'Use biometric authentication',
      };
  }
};

const getSpinnerColor = (variant: string): string => {
  switch (variant) {
    case 'primary':
      return '#ffffff';
    case 'secondary':
      return '#ffffff';
    case 'outline':
      return '#007AFF';
    default:
      return '#ffffff';
  }
};

const getIconColor = (variant: string): string => {
  switch (variant) {
    case 'primary':
      return '#ffffff';
    case 'secondary':
      return '#ffffff';
    case 'outline':
      return '#007AFF';
    default:
      return '#ffffff';
  }
};

const getSubtitleColor = (variant: string): string => {
  switch (variant) {
    case 'primary':
      return '#e6f3ff';
    case 'secondary':
      return '#e6f7e6';
    case 'outline':
      return '#666666';
    default:
      return '#e6f3ff';
  }
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Variants
  primary: {
    backgroundColor: '#007AFF',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#34C759',
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  
  // Sizes
  small: {
    height: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  medium: {
    height: 80,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  large: {
    height: 100,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
  
  // Content layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  
  // Icon styles
  icon: {
    marginRight: 16,
    textAlign: 'center',
  },
  smallIcon: {
    fontSize: 24,
  },
  mediumIcon: {
    fontSize: 32,
  },
  largeIcon: {
    fontSize: 40,
  },
  
  // Text container
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    marginBottom: 4,
  },
  
  // Text variants
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#007AFF',
  },
  
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Subtitle
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  
  // Loading state
  spinner: {
    marginRight: 16,
  },
  
  disabledText: {
    opacity: 0.8,
  },
});