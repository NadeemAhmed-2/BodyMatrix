import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../styles/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '368618655974-lgfa63tp5qtv9gtu9ipg6i8fprgaj46r.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen({ onNavigate, onLoginSuccess, baseUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const handleLogin = async () => {
    // Basic validation
    const tempErrors = {};
    if (!email) tempErrors.email = 'Email is required';
    if (!password) tempErrors.password = 'Password is required';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store Token, User Data and Profile Data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        if (data.profile) {
          await AsyncStorage.setItem('profileData', JSON.stringify(data.profile));
        }

        onLoginSuccess(data.token, data.user, data.profile);
      } else if (data.unverified) {
        Alert.alert('Account Unverified', data.error || 'Verification code sent to your email.');
        onNavigate('Verify', { email: data.email || email });
      } else {
        Alert.alert('Authentication Failed', data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Could not connect to the server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: use Firebase popup
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        const idToken = await firebaseUser.getIdToken();

        const response = await fetch(`${baseUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: idToken,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
          if (data.profile) {
            await AsyncStorage.setItem('profileData', JSON.stringify(data.profile));
          }
          Alert.alert('Success', `Welcome back, ${data.user.name}! Logged in successfully.`);
          onLoginSuccess(data.token, data.user, data.profile);
        } else {
          Alert.alert('Authentication Failed', data.error || 'Could not authenticate with server.');
        }
      } else {
        // Native: use @react-native-google-signin/google-signin
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();
        let idToken = userInfo.idToken;
        if (!idToken && userInfo.data) {
          idToken = userInfo.data.idToken;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const firebaseResult = await signInWithCredential(auth, credential);
        const firebaseUser = firebaseResult.user;

        const firebaseIdToken = await firebaseUser.getIdToken();

        const response = await fetch(`${baseUrl}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: firebaseIdToken,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
          if (data.profile) {
            await AsyncStorage.setItem('profileData', JSON.stringify(data.profile));
          }
          Alert.alert('Success', `Welcome back, ${data.user.name}! Logged in successfully.`);
          onLoginSuccess(data.token, data.user, data.profile);
        } else {
          Alert.alert('Authentication Failed', data.error || 'Could not authenticate with server.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Google Sign-In Error', error.message || 'An error occurred during Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LOGIN</Text>
        <Text style={styles.subtitle}>UNLEASH YOUR POWER</Text>
        <View style={styles.accentBar} />
      </View>

      <View style={styles.form}>
        <Input
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          placeholder="ENTER YOUR EMAIL"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Input
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          placeholder="ENTER YOUR PASSWORD"
          secureTextEntry
          autoCapitalize="none"
          error={errors.password}
        />

        <Button
          title="LOG IN"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>DONT HAVE AN ACCOUNT? </Text>
        <TouchableOpacity onPress={() => onNavigate('Register')}>
          <Text style={styles.link}>SIGN UP</Text>
        </TouchableOpacity>
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
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  accentBar: {
    height: 4,
    width: 60,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  button: {
    marginTop: SPACING.lg,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  separatorText: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  googleButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    minHeight: 52,
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
});
