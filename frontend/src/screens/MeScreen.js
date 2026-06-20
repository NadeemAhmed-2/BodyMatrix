import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Button from '../components/Button';

export default function MeScreen({ user, profile, onEditProfile, onLogout }) {
  const calcProfile = user?.profile || {};
  
  // Format goal text
  const formatGoal = (goal) => {
    if (goal === 'lose') return 'WEIGHT LOSS';
    if (goal === 'gain') return 'WEIGHT GAIN';
    if (goal === 'maintain') return 'MAINTENANCE';
    return 'NOT SPECIFIED';
  };

  // Format activity level text
  const formatActivity = (level) => {
    if (!level) return 'NOT SPECIFIED';
    return level.replace('_', ' ').toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>FUEL & FLOW</Text>
      </View>

      {/* Profile Portrait Section */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarBorder}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop' }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.userName}>{profile?.name?.toUpperCase() || user?.name?.toUpperCase() || 'BODY MATRIX USER'}</Text>
        <Text style={styles.userTier}>ELITE PERFORMANCE TIER</Text>
        <View style={styles.accentBar} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>GENDER</Text>
          <Text style={styles.statValue}>{profile?.gender?.toUpperCase() || 'MALE'}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>AGE</Text>
          <Text style={styles.statValue}>{profile?.age ? `${profile.age} YRS` : 'NOT SET'}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>MASS</Text>
          <Text style={styles.statValue}>{profile?.weightKg ? `${profile.weightKg} KG` : 'NOT SET'}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>HEIGHT</Text>
          <Text style={styles.statValue}>{profile?.heightCm ? `${profile.heightCm} CM` : 'NOT SET'}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>GOAL</Text>
          <Text style={styles.statValue}>{formatGoal(calcProfile.goal)}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>ACTIVITY</Text>
          <Text style={styles.statValue}>{formatActivity(calcProfile.activityLevel)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="EDIT PROFILE"
          onPress={onEditProfile}
          style={styles.editBtn}
        />
        
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>LOGOUT PROTOCOL</Text>
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
    paddingTop: 50,
    paddingBottom: 100,
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '950',
    color: COLORS.white,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLow,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  userTier: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  accentBar: {
    height: 4,
    width: 60,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  statsGrid: {
    width: '100%',
    maxWidth: 320,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  statLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: 'monospace',
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  editBtn: {
    width: '100%',
  },
  logoutBtn: {
    paddingVertical: SPACING.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontFamily: 'monospace',
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
