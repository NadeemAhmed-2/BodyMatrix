import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Dimensions, Alert, Platform, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function HomeScreen({ targets, profile, onNavigate, onLogout }) {
  const [menuVisible, setMenuVisible] = useState(false);
  // Get calorie target based on goal
  const goalCalorieTarget = profile?.goal === 'lose' 
    ? targets?.weightLossCalories 
    : profile?.goal === 'gain' 
      ? targets?.weightGainCalories 
      : targets?.maintenanceCalories || 2000;

  // Let's mock remaining calories (e.g., consumed 800)
  const consumed = 800;
  const remaining = Math.max(0, goalCalorieTarget - consumed);
  const remainingKcalText = remaining >= 1000 
    ? `${(remaining / 1000).toFixed(1)}K` 
    : `${remaining}`;

  return (
    <View style={styles.rootContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.brandTitle}>BODY MATRIX</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Text style={styles.iconText}>🔔</Text>
          </TouchableOpacity>
        </View>

      {/* Hero Banner: Daily Grind */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop' }}
        style={styles.heroBanner}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroBadge}>CURRENT SESSION</Text>
          <Text style={styles.heroTitle}>DAILY GRIND</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ELAPSED</Text>
              <Text style={styles.statValue}>42:15</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>VOLUME</Text>
              <Text style={styles.statValue}>12,400KG</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Bento Grid */}
      <View style={styles.gridContainer}>
        {/* Left Column: TRAIN HUB (Vertical/Large Tile) */}
        <TouchableOpacity 
          style={styles.trainTile} 
          activeOpacity={0.8}
          onPress={() => onNavigate('TrainHubPlaceholder')}
        >
          <View style={styles.tileHeader}>
            <Text style={styles.tileIcon}>🏋️‍♂️</Text>
            <Text style={styles.tileTitle}>TRAIN{"\n"}HUB</Text>
          </View>
          
          <View style={styles.tileFooter}>
            <Text style={styles.tileSubLabel}>NEXT UP</Text>
            <Text style={styles.tileSubValue}>Heavy Leg Press</Text>
            <View style={styles.limeButton}>
              <Text style={styles.limeButtonText}>RESUME</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Column: FUEL CALC & MEAL LAB */}
        <View style={styles.rightColumn}>
          {/* Top: FUEL CALC */}
          <TouchableOpacity 
            style={styles.fuelCalcTile} 
            activeOpacity={0.8}
            onPress={() => onNavigate('Results')}
          >
            <View style={styles.fuelCalcHeader}>
              <Text style={styles.tileTitle}>FUEL{"\n"}CALC</Text>
              <Text style={styles.fuelCalcIcon}>🧮</Text>
            </View>
            
            <View style={styles.fuelCalcFooter}>
              <Text style={styles.fuelCalcValue}>{remainingKcalText} KCAL LEFT</Text>
              
              {/* Progress Circle Visual */}
              <View style={styles.circleContainer}>
                <View style={styles.circleBackground} />
                <View style={styles.circleFill} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Bottom: MEAL LAB */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop' }}
            style={styles.mealLabTile}
            imageStyle={styles.mealLabImage}
            resizeMode="cover"
          >
            <TouchableOpacity 
              style={styles.mealLabOverlay} 
              activeOpacity={0.8}
              onPress={() => onNavigate('MealConfig')}
            >
              <View style={styles.fuelCalcHeader}>
                <Text style={styles.tileTitle}>MEAL{"\n"}LAB</Text>
                <Text style={styles.mealLabIcon}>🥗</Text>
              </View>
              <Text style={styles.mealLabFooterText}>RECIPE RECO: KETO BOWL</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>
      </View>

      {/* Floating Action Button for quick logging */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => Alert.alert('Quick Action', 'Workout Logging coming soon!')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      </ScrollView>

      {menuVisible && (
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  onLogout();
                }}
              >
                <Text style={styles.dropdownItemText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: 50,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    width: '100%',
  },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  heroBanner: {
    width: '100%',
    height: 300,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroImage: {
    opacity: 0.4,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.4)',
    padding: SPACING.xl,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: COLORS.primary,
    marginVertical: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceHigh,
    marginHorizontal: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  trainTile: {
    flex: 1,
    height: 310,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flex: 1,
  },
  tileIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    lineHeight: 22,
  },
  tileFooter: {
    marginTop: SPACING.md,
  },
  tileSubLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 1,
  },
  tileSubValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  limeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limeButtonText: {
    color: COLORS.black,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  rightColumn: {
    flex: 1,
    gap: SPACING.md,
  },
  fuelCalcTile: {
    height: 147,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  fuelCalcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fuelCalcIcon: {
    fontSize: 18,
  },
  fuelCalcFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fuelCalcValue: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  circleContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  circleBackground: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  circleFill: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  mealLabTile: {
    height: 147,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  mealLabImage: {
    opacity: 0.3,
  },
  mealLabOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.6)',
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  mealLabIcon: {
    fontSize: 18,
  },
  mealLabFooterText: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: COLORS.black,
    fontSize: 28,
    fontWeight: '300',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 95,
    left: SPACING.lg,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 4,
    width: 120,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
