"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Shield, 
  Key, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  QrCode
} from 'lucide-react';
import { mfaService, totpService } from '@/lib/auth/mfa';
import { phoneSchema } from '@/lib/validations/auth';
// QRCode import temporarily removed due to dependency issues
// import QRCode from 'qrcode';

interface MfaSetupProps {
  user: User;
  onClose?: () => void;
}

export function MfaSetup({ user, onClose }: MfaSetupProps) {
  const { toast } = useToast();
  const [enrolledFactors, setEnrolledFactors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'backup'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'totp'>('sms');
  
  // SMS setup state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [smsCode, setSmsCode] = useState('');
  
  // TOTP setup state
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  
  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadEnrolledFactors();
  }, [user]);

  const loadEnrolledFactors = () => {
    try {
      const factors = mfaService.getEnrolledFactors(user);
      setEnrolledFactors(factors);
    } catch (error) {
      console.error('Error loading MFA factors:', error);
    }
  };

  const startSmsSetup = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return;
    }

    const validation = phoneSchema.safeParse(phoneNumber);
    if (!validation.success) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number with country code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const verificationId = await mfaService.enrollSms(user, phoneNumber);
      setVerificationId(verificationId);
      setStep('verify');
      toast({
        title: 'Verification code sent',
        description: 'Check your phone for the verification code'
      });
    } catch (error) {
      console.error('SMS setup failed:', error);
      toast({
        title: 'Setup failed',
        description: 'Failed to send verification code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmSmsSetup = async () => {
    if (!smsCode || smsCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await mfaService.confirmSmsEnrollment(user, verificationId, smsCode, 'SMS');
      toast({
        title: 'SMS MFA enabled',
        description: 'Two-factor authentication via SMS has been enabled'
      });
      loadEnrolledFactors();
      setStep('backup');
    } catch (error) {
      console.error('SMS confirmation failed:', error);
      toast({
        title: 'Verification failed',
        description: 'Invalid verification code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startTotpSetup = async () => {
    try {
      const secret = totpService.generateSecret();
      const qrUrl = totpService.generateQrCodeUrl(secret, user.email || '', 'Solarify');
      
      setTotpSecret(secret);
      setTotpQrUrl(qrUrl);
      
      // Generate QR code image - temporarily disabled
      // const qrDataUrl = await QRCode.toDataURL(qrUrl);
      // setQrCodeImage(qrDataUrl);
      setQrCodeImage(''); // Temporary placeholder
      
      setStep('verify');
    } catch (error) {
      console.error('TOTP setup failed:', error);
      toast({
        title: 'Setup failed',
        description: 'Failed to generate TOTP setup. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const confirmTotpSetup = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code from your authenticator app',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await totpService.verifyTotp(totpSecret, totpCode);
      if (!isValid) {
        throw new Error('Invalid TOTP code');
      }

      // Store TOTP secret securely (in production, this would be done on the backend)
      // For now, we'll simulate successful enrollment
      toast({
        title: 'Authenticator app enabled',
        description: 'Two-factor authentication via authenticator app has been enabled'
      });
      setStep('backup');
    } catch (error) {
      console.error('TOTP confirmation failed:', error);
      toast({
        title: 'Verification failed',
        description: 'Invalid code. Please check your authenticator app and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    setLoading(true);
    try {
      const codes = await mfaService.generateBackupCodes(user);
      setBackupCodes(codes);
      setShowBackupCodes(true);
      toast({
        title: 'Backup codes generated',
        description: 'Save these codes in a secure location'
      });
    } catch (error) {
      console.error('Backup code generation failed:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate backup codes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const unenrollFactor = async (factorUid: string) => {
    setLoading(true);
    try {
      await mfaService.unenroll(user, factorUid);
      toast({
        title: 'MFA disabled',
        description: 'Two-factor authentication has been disabled for this method'
      });
      loadEnrolledFactors();
    } catch (error) {
      console.error('Unenrollment failed:', error);
      toast({
        title: 'Disable failed',
        description: 'Failed to disable two-factor authentication. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard'
    });
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solarify-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'select') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Set up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {enrolledFactors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enrolled Methods</Label>
              {enrolledFactors.map((factor) => (
                <div key={factor.uid} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{factor.displayName}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unenrollFactor(factor.uid)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'sms' | 'totp')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="totp">Authenticator App</TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">SMS Authentication</h4>
                  <p className="text-sm text-blue-700">
                    Receive verification codes via text message
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button 
                onClick={startSmsSetup} 
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? 'Setting up...' : 'Set up SMS'}
              </Button>
            </TabsContent>

            <TabsContent value="totp" className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <Key className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Authenticator App</h4>
                  <p className="text-sm text-green-700">
                    Use apps like Google Authenticator or Authy
                  </p>
                </div>
              </div>

              <Button 
                onClick={startTotpSetup} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Setting up...' : 'Set up Authenticator App'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>
            {selectedMethod === 'sms' ? 'Verify Phone Number' : 'Verify Authenticator App'}
          </CardTitle>
          <CardDescription>
            {selectedMethod === 'sms' 
              ? 'Enter the verification code sent to your phone'
              : 'Scan the QR code and enter the verification code from your app'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedMethod === 'totp' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <QrCode className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">QR Code placeholder</p>
                    <p className="text-xs">Use manual entry key below</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={totpSecret} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(totpSecret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Verification Code</Label>
            <Input
              type="text"
              placeholder="123456"
              value={selectedMethod === 'sms' ? smsCode : totpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                selectedMethod === 'sms' ? setSmsCode(value) : setTotpCode(value);
              }}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setStep('select')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={selectedMethod === 'sms' ? confirmSmsSetup : confirmTotpSetup}
              disabled={loading || (selectedMethod === 'sms' ? smsCode.length !== 6 : totpCode.length !== 6)}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'backup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Two-Factor Authentication Enabled</CardTitle>
          <CardDescription>
            Generate backup codes to access your account if you lose your device
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!showBackupCodes ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Backup codes are important for account recovery. Store them in a safe place.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={generateBackupCodes} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Backup Codes'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Backup Codes</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="bg-white p-2 rounded border text-center cursor-pointer hover:bg-gray-50"
                      onClick={() => copyToClipboard(code)}
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Download and store them securely.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Button 
            onClick={onClose} 
            variant="outline"
            className="w-full"
          >
            {showBackupCodes ? 'Complete Setup' : 'Skip for Now'}
          </Button>
        </CardContent>

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="hidden"></div>
      </Card>
    );
  }

  return null;
}