// =============================================================================
// Social Authentication Button Component
// =============================================================================
// Reusable button for Google, Apple, and other social auth providers
// =============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

export interface SocialButtonProps {
  type: 'google' | 'apple' | 'facebook' | 'microsoft';
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  type,
  onPress,
  disabled = false,
  style,
  textStyle,
  size = 'medium',
}) => {
  const buttonConfig = getSocialButtonConfig(type);
  
  const buttonStyles = [
    styles.button,
    styles[size],
    {
      backgroundColor: buttonConfig.backgroundColor,
      borderColor: buttonConfig.borderColor,
    },
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    {
      color: buttonConfig.textColor,
    },
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {buttonConfig.icon && (
          <Text style={[styles.icon, styles[`${size}Icon`]]}>
            {buttonConfig.icon}
          </Text>
        )}
        <Text style={textStyles}>{buttonConfig.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface SocialButtonConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  icon?: string;
}

const getSocialButtonConfig = (type: string): SocialButtonConfig => {
  switch (type) {
    case 'google':
      return {
        label: 'Continue with Google',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        borderColor: '#e0e0e0',
        icon: 'G', // In production, use proper icon from react-native-vector-icons
      };
    case 'apple':
      return {
        label: 'Continue with Apple',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        borderColor: '#000000',
        icon: '🍎',
      };
    case 'facebook':
      return {
        label: 'Continue with Facebook',
        backgroundColor: '#1877f2',
        textColor: '#ffffff',
        borderColor: '#1877f2',
        icon: 'f',
      };
    case 'microsoft':
      return {
        label: 'Continue with Microsoft',
        backgroundColor: '#0078d4',
        textColor: '#ffffff',
        borderColor: '#0078d4',
        icon: 'M',
      };
    default:
      return {
        label: 'Continue',
        backgroundColor: '#007AFF',
        textColor: '#ffffff',
        borderColor: '#007AFF',
      };
  }
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  
  // Sizes
  small: {
    height: 36,
    paddingHorizontal: 12,
  },
  medium: {
    height: 48,
    paddingHorizontal: 16,
  },
  large: {
    height: 56,
    paddingHorizontal: 20,
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
  },
  
  // Icon styles
  icon: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  smallIcon: {
    fontSize: 14,
  },
  mediumIcon: {
    fontSize: 16,
  },
  largeIcon: {
    fontSize: 18,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
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
  
  disabledText: {
    opacity: 0.8,
  },
});