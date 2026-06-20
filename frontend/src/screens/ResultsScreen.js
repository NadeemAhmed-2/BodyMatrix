import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Button from '../components/Button';

export default function ResultsScreen({ targets, profile, onRecalculate, onLogout }) {
  if (!targets || !profile || !targets.macros) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.row}>
            <Text style={styles.title}>TARGETS</Text>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>YOUR PERSONAL EVOLUTION EQUATION</Text>
          <View style={styles.accentBar} />
        </View>

        <View style={styles.noTargetsCard}>
          <Text style={styles.noTargetsTitle}>NO ACTIVE PROTOCOL</Text>
          <Text style={styles.noTargetsText}>
            You have not calculated your performance metrics yet. Complete your metrics to generate daily targets.
          </Text>
          <Button
            title="SETUP METRICS"
            onPress={onRecalculate}
            style={styles.noTargetsBtn}
          />
        </View>
      </View>
    );
  }

  const goalCalorieTarget = profile.goal === 'lose' 
    ? targets.weightLossCalories 
    : profile.goal === 'gain' 
      ? targets.weightGainCalories 
      : targets.maintenanceCalories;

  const goalText = profile.goal === 'lose' 
    ? 'WEIGHT LOSS' 
    : profile.goal === 'gain' 
      ? 'WEIGHT GAIN' 
      : 'MAINTENANCE';

  // Compute macro percentages for visualization
  const proteinKcal = targets.macros.protein * 4;
  const fatKcal = targets.macros.fat * 9;
  const carbsKcal = targets.macros.carbs * 4;
  const totalKcal = proteinKcal + fatKcal + carbsKcal;

  const proteinPct = totalKcal > 0 ? (proteinKcal / totalKcal) * 100 : 0;
  const fatPct = totalKcal > 0 ? (fatKcal / totalKcal) * 100 : 0;
  const carbsPct = totalKcal > 0 ? (carbsKcal / totalKcal) * 100 : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.title}>TARGETS</Text>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>YOUR PERSONAL EVOLUTION EQUATION</Text>
        <View style={styles.accentBar} />
      </View>

      {/* Main Target Calories Card */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardLabel}>{goalText} TARGET</Text>
        <Text style={styles.mainCalorieNumber}>{goalCalorieTarget}</Text>
        <Text style={styles.mainCalorieUnit}>KCAL / DAY</Text>
        
        {targets.weeklyProjectionKg !== 0 && (
          <View style={styles.projectionBadge}>
            <Text style={styles.projectionText}>
              ESTIMATED CHANGE: {targets.weeklyProjectionKg > 0 ? `+${targets.weeklyProjectionKg}` : targets.weeklyProjectionKg} KG / WEEK
            </Text>
          </View>
        )}
      </View>

      {/* TDEE & BMR Comparison Row */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.gridItemLabel}>MAINTENANCE</Text>
          <Text style={styles.gridItemValue}>{targets.maintenanceCalories}</Text>
          <Text style={styles.gridItemUnit}>KCAL/DAY</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridItemLabel}>GOAL DEFICIT/SURPLUS</Text>
          <Text style={[styles.gridItemValue, { color: goalCalorieTarget < targets.maintenanceCalories ? COLORS.error : COLORS.primary }]}>
            {goalCalorieTarget - targets.maintenanceCalories > 0 ? '+' : ''}
            {goalCalorieTarget - targets.maintenanceCalories}
          </Text>
          <Text style={styles.gridItemUnit}>KCAL</Text>
        </View>
      </View>

      {/* Macronutrient Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MACRONUTRIENTS</Text>
        
        {/* Visual Bar Graph */}
        <View style={styles.macroBarContainer}>
          <View style={[styles.macroBarSegment, { width: `${proteinPct}%`, backgroundColor: COLORS.primary }]} />
          <View style={[styles.macroBarSegment, { width: `${carbsPct}%`, backgroundColor: COLORS.secondary }]} />
          <View style={[styles.macroBarSegment, { width: `${fatPct}%`, backgroundColor: COLORS.white }]} />
        </View>

        {/* Legend / List */}
        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.colorIndicator, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.macroName}>PROTEIN</Text>
            </View>
            <Text style={styles.macroWeight}>{targets.macros.protein}g</Text>
          </View>
          <Text style={styles.macroSubText}>{Math.round(proteinPct)}% • {proteinKcal} kcal</Text>
        </View>

        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.colorIndicator, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.macroName}>CARBOHYDRATES</Text>
            </View>
            <Text style={styles.macroWeight}>{targets.macros.carbs}g</Text>
          </View>
          <Text style={styles.macroSubText}>{Math.round(carbsPct)}% • {carbsKcal} kcal</Text>
        </View>

        <View style={styles.macroItem}>
          <View style={styles.macroHeader}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.colorIndicator, { backgroundColor: COLORS.white }]} />
              <Text style={styles.macroName}>FAT</Text>
            </View>
            <Text style={styles.macroWeight}>{targets.macros.fat}g</Text>
          </View>
          <Text style={styles.macroSubText}>{Math.round(fatPct)}% • {Math.round(fatKcal)} kcal</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="RECALCULATE PROFILE"
          variant="secondary"
          onPress={onRecalculate}
          style={styles.actionBtn}
        />
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
  },
  header: {
    marginBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.primary,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  accentBar: {
    height: 4,
    width: 60,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
  },
  mainCard: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  mainCardLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  mainCalorieNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 70,
    marginTop: SPACING.sm,
  },
  mainCalorieUnit: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  projectionBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.lg,
  },
  projectionText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
  },
  gridItemLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  gridItemValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  gridItemUnit: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHigh,
    paddingBottom: SPACING.xs,
  },
  macroBarContainer: {
    height: 12,
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  macroBarSegment: {
    height: '100%',
  },
  macroItem: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  colorIndicator: {
    width: 12,
    height: 12,
  },
  macroName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
  },
  macroWeight: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  macroSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginLeft: 20,
  },
  actions: {
    marginBottom: 40,
  },
  actionBtn: {
    width: '100%',
  },
  noTargetsCard: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 2,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  noTargetsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  noTargetsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  noTargetsBtn: {
    width: '100%',
  },
});
