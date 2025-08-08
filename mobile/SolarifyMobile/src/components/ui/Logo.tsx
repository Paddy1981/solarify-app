// =============================================================================
// Logo Component
// =============================================================================
// Solarify brand logo with customizable size and styling
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface LogoProps {
  size?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'light' | 'dark' | 'color';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 60,
  style,
  textStyle,
  variant = 'color',
  showTagline = false,
}) => {
  const logoStyles = [
    styles.container,
    { width: size * 1.5, height: size * 1.5 },
    style,
  ];

  const iconStyles = [
    styles.icon,
    { fontSize: size },
    getIconColor(variant),
    textStyle,
  ];

  const brandStyles = [
    styles.brandText,
    { fontSize: size * 0.3 },
    getBrandColor(variant),
  ];

  const taglineStyles = [
    styles.tagline,
    { fontSize: size * 0.15 },
    getTaglineColor(variant),
  ];

  return (
    <View style={logoStyles}>
      {/* Solar Icon */}
      <View style={styles.iconContainer}>
        <Text style={iconStyles}>☀️</Text>
      </View>
      
      {/* Brand Name */}
      <Text style={brandStyles}>Solarify</Text>
      
      {/* Tagline */}
      {showTagline && (
        <Text style={taglineStyles}>Solar Marketplace</Text>
      )}
    </View>
  );
};

const getIconColor = (variant: string): TextStyle => {
  switch (variant) {
    case 'light':
      return { color: '#ffffff' };
    case 'dark':
      return { color: '#1a1a1a' };
    case 'color':
    default:
      return { color: '#FFA500' }; // Solar orange
  }
};

const getBrandColor = (variant: string): TextStyle => {
  switch (variant) {
    case 'light':
      return { color: '#ffffff' };
    case 'dark':
      return { color: '#1a1a1a' };
    case 'color':
    default:
      return { color: '#2E7D32' }; // Solar green
  }
};

const getTaglineColor = (variant: string): TextStyle => {
  switch (variant) {
    case 'light':
      return { color: '#e0e0e0' };
    case 'dark':
      return { color: '#666666' };
    case 'color':
    default:
      return { color: '#757575' }; // Neutral gray
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 4,
  },
  icon: {
    textAlign: 'center',
    // Add shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  brandText: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    // Add shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tagline: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
});