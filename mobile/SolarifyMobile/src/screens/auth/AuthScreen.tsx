// =============================================================================
// Authentication Screen with Biometric Support
// =============================================================================
// Comprehensive auth screen supporting email/password, social login, and biometrics
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { authService } from '@solarify/services';
import { biometricAuthService } from '../../services/biometric-auth.service';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { SocialButton } from '../../components/ui/SocialButton';
import { BiometricButton } from '../../components/ui/BiometricButton';
import { Logo } from '../../components/ui/Logo';
import { NavigationProps } from '../../types';

interface AuthFormData {
  email: string;
  password: string;
}

interface AuthScreenProps extends NavigationProps {}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // State management
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  // Initialize component
  useEffect(() => {
    initializeAuth();
    checkBiometricAvailability();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize auth service
      await authService.initialize();
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with actual web client ID
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const capability = await biometricAuthService.checkBiometricSupport();
      setBiometricAvailable(capability.isAvailable);
      
      if (capability.isAvailable && capability.biometryType) {
        setBiometricType(biometricAuthService.getBiometricTypeName(capability.biometryType));
        
        const isEnabled = await biometricAuthService.isBiometricEnabled();
        setBiometricEnabled(isEnabled);
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
    }
  };

  // Form handlers
  const updateFormData = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    
    if (isSignUp && formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  // Authentication methods
  const handleEmailAuth = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isSignUp) {
        // For demo purposes, using basic signup - in production, collect more user info
        const signUpData = {
          email: formData.email,
          password: formData.password,
          firstName: 'User', // Would come from form
          lastName: 'Name',   // Would come from form
          role: 'homeowner' as const,
        };
        
        const result = await authService.signUp(signUpData);
        
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsSignUp(false);
                // Optionally offer biometric setup
                offerBiometricSetup();
              }
            }
          ]
        );
        
      } else {
        const result = await authService.signIn(formData);
        
        // Offer biometric setup for first-time users
        if (biometricAvailable && !biometricEnabled) {
          offerBiometricSetup();
        }
        
        // Navigate to main app
        navigation.replace('MainTabs');
      }
      
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    
    try {
      const credentials = await biometricAuthService.authenticateWithBiometric({
        title: `Sign in with ${biometricType}`,
        subtitle: 'Use your biometric to access Solarify',
      });
      
      // Sign in with stored credentials
      const result = await authService.signIn({
        email: credentials.username,
        password: atob(credentials.hashedCredentials), // Decode stored password
      });
      
      // Navigate to main app
      navigation.replace('MainTabs');
      
    } catch (error: any) {
      if (!error.userMessage?.includes('cancelled')) {
        Alert.alert('Biometric Authentication Failed', error.userMessage || error.message);
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        const googleCredential = authService.GoogleAuthProvider.credential(userInfo.idToken);
        const result = await authService.signInWithGoogle(googleCredential);
        
        if (result.isNewUser) {
          // Show welcome message and role selection
          Alert.alert(
            'Welcome to Solarify!',
            'Please complete your profile setup.',
            [{ text: 'OK', onPress: () => navigation.navigate('ProfileSetup') }]
          );
        } else {
          navigation.replace('MainTabs');
        }
      }
      
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    // Apple Sign-In implementation would go here
    // Requires react-native-apple-authentication
    Alert.alert('Apple Sign-In', 'Apple Sign-In integration coming soon!');
  };

  const offerBiometricSetup = () => {
    if (!biometricAvailable) return;
    
    Alert.alert(
      `Enable ${biometricType}?`,
      `Would you like to use ${biometricType} for faster sign-in?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              await biometricAuthService.setupBiometricAuth(
                formData.email,
                formData.password
              );
              setBiometricEnabled(true);
              Alert.alert('Success', `${biometricType} has been enabled!`);
            } catch (error: any) {
              Alert.alert('Setup Failed', error.message);
            }
          }
        }
      ]
    );
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    
    Alert.alert(
      'Reset Password',
      `Send password reset instructions to ${formData.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await authService.resetPassword(formData.email);
              Alert.alert('Success', 'Password reset instructions sent to your email.');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Header */}
        <View style={styles.header}>
          <Logo size={80} />
          <Text style={styles.title}>
            {isSignUp ? 'Join Solarify' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? 'Create your account to start your solar journey'
              : 'Sign in to access your solar marketplace'
            }
          </Text>
        </View>

        {/* Biometric Authentication */}
        {!isSignUp && biometricEnabled && (
          <View style={styles.biometricSection}>
            <BiometricButton
              biometricType={biometricType}
              onPress={handleBiometricAuth}
              loading={biometricLoading}
            />
            <Text style={styles.orDivider}>or sign in with your email</Text>
          </View>
        )}

        {/* Email/Password Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isSignUp ? 'password-new' : 'password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
            />
          </View>

          {/* Forgot Password Link */}
          {!isSignUp && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <LoadingButton
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleEmailAuth}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        {/* Social Login */}
        <View style={styles.socialSection}>
          <Text style={styles.orDivider}>or continue with</Text>
          
          <View style={styles.socialButtons}>
            <SocialButton
              type="google"
              onPress={handleGoogleSignIn}
              disabled={loading}
            />
            
            {Platform.OS === 'ios' && (
              <SocialButton
                type="apple"
                onPress={handleAppleSignIn}
                disabled={loading}
              />
            )}
          </View>
        </View>

        {/* Toggle Sign Up/Sign In */}
        <View style={styles.toggleSection}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleLink}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  biometricSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  socialSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  orDivider: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 16,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 4,
  },
  toggleLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});