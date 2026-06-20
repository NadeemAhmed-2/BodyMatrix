import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Button from '../components/Button';

export default function LandingScreen({ onNavigate }) {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>FUEL & FLOW</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.headline}>FUEL YOUR{"\n"}EVOLUTION</Text>
          <View style={styles.divider} />
          
          <View style={styles.actions}>
            <Button
              title="GET STARTED"
              variant="primary"
              onPress={() => onNavigate('Register')}
              style={styles.button}
            />
            <Button
              title="LOGIN"
              variant="secondary"
              onPress={() => onNavigate('Login')}
              style={styles.button}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>⚡ OPTIMIZED FOR ELITE PERFORMANCE</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    justifyContent: 'space-between',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headline: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -1,
  },
  divider: {
    height: 6,
    width: 120,
    backgroundColor: COLORS.primary,
    marginTop: 20,
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
});
