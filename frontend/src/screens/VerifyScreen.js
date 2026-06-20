import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Button from '../components/Button';

export default function VerifyScreen({ email, onNavigate, onVerificationSuccess, baseUrl }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const inputRefs = useRef([]);

  const handleInputChange = (text, index) => {
    // Only accept numeric inputs
    const cleanText = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = cleanText;
    setCode(newCode);

    if (cleanText && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current field is empty, clear the previous field and focus it
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      Alert.alert('Incomplete Code', 'Please enter all 4 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: fullCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onVerificationSuccess(data.token, data.user, data.profile);
      } else {
        Alert.alert('Verification Failed', data.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      const response = await fetch(`${baseUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        setCode(['', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        Alert.alert('Resend Failed', data.error || 'Failed to resend verification code.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => onNavigate('Register')}
      >
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.brandTitle}>ELITE FIT</Text>
        <Text style={styles.title}>VERIFY PROTOCOL</Text>
        <Text style={styles.subtitle}>
          WE'VE SENT A CODE TO {email.toUpperCase()}. ENTER IT BELOW TO UNLOCK ACCESS.
        </Text>
        <View style={styles.accentBar} />
      </View>

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            placeholder="-"
            placeholderTextColor="rgba(255, 255, 255, 0.1)"
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="VERIFY IDENTITY"
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity 
          onPress={handleResendCode} 
          disabled={resending} 
          style={styles.resendBtn}
        >
          {resending ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.resendText}>RESEND CODE ↻</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE ACCESS PROTOCOL • EST. MMXXVI</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.xl,
    padding: SPACING.sm,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
    fontSize: 12,
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
    maxWidth: 300,
  },
  accentBar: {
    height: 4,
    width: 60,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.lg,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  codeInput: {
    width: 60,
    height: 75,
    backgroundColor: COLORS.surfaceLow,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.outlineVariant,
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  button: {
    width: '100%',
  },
  resendBtn: {
    padding: SPACING.md,
  },
  resendText: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: SPACING.xxl,
    opacity: 0.4,
  },
  footerText: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
});
