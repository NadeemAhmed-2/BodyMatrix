import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';

export default function MealPlanScreen({ plan, profile, targets, onBack, onSave }) {
  if (!plan) return null;

  // Extract variables
  const { targetCalories, diet, mealsPerDay, totalNutrition, meals } = plan;

  // Get macro targets from profile/targets or compute defaults
  const proteinTarget = targets?.proteinGrams || Math.round((targetCalories * 0.3) / 4);
  const carbsTarget = targets?.carbsGrams || Math.round((targetCalories * 0.45) / 4);
  const fatTarget = targets?.fatGrams || Math.round((targetCalories * 0.25) / 9);

  // Compute percentages for progress bars
  const pPct = Math.min(100, Math.round((totalNutrition.protein_g / proteinTarget) * 100));
  const cPct = Math.min(100, Math.round((totalNutrition.carbohydrates_total_g / carbsTarget) * 100));
  const fPct = Math.min(100, Math.round((totalNutrition.fat_total_g / fatTarget) * 100));

  const modeBadgeText = mealsPerDay === 1 ? 'SOLO PROTOCOL'
    : mealsPerDay === 2 ? 'DUAL PROTOCOL'
    : mealsPerDay === 3 ? 'TRIAD PROTOCOL'
    : '4+ MEAL EXPERT MODE';

  const handleSaveProtocol = () => {
    Alert.alert('Protocol Logged', 'Meal plan protocol successfully registered in your daily tracker!', [
      { text: 'OK', onPress: () => onSave() }
    ]);
  };

  const getPairingIcon = (icon) => {
    switch(icon) {
      case 'coffee': return '☕';
      case 'local_drink': return '🥤';
      default: return '🥤';
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleIcon}>⚡</Text>
          <Text style={styles.headerTitle}>FUEL & FLOW</Text>
        </View>
        <View style={styles.avatarPlaceholder} />
      </View>

      {/* Dynamic Title / Badge */}
      <View style={styles.titleSection}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{modeBadgeText}</Text>
          </View>
          <Text style={styles.dietBadgeText}>//{diet.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>DYNAMIC PROTOCOL</Text>
      </View>

      {/* Macro Summary Dashboard */}
      <View style={styles.dashboard}>
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.dashboardSub}>DAILY TARGET</Text>
            <Text style={styles.dashboardVal}>
              {totalNutrition.calories} <Text style={styles.kcalUnit}>KCAL</Text>
            </Text>
          </View>
          <View style={styles.surgeBadge}>
            <Text style={styles.surgeText}>METABOLIC SURGE ACTIVE</Text>
          </View>
        </View>

        <View style={styles.macroBars}>
          {/* Protein */}
          <View style={styles.macroItem}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabel}>PROTEIN (P)</Text>
              <Text style={styles.macroValues}>
                {totalNutrition.protein_g}g / {proteinTarget}g
              </Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pPct}%` }]} />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroItem}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabel}>CARBS (C)</Text>
              <Text style={styles.macroValues}>
                {totalNutrition.carbohydrates_total_g}g / {carbsTarget}g
              </Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${cPct}%` }]} />
            </View>
          </View>

          {/* Fats */}
          <View style={styles.macroItem}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabel}>FATS (F)</Text>
              <Text style={styles.macroValues}>
                {totalNutrition.fat_total_g}g / {fatTarget}g
              </Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${fPct}%` }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Meal Cards */}
      <View style={styles.mealsList}>
        {meals.map((meal, index) => (
          <View key={index} style={styles.mealCardContainer}>
            {/* Time / Label Line */}
            <View style={styles.timeLineRow}>
              <Text style={styles.timeText}>{meal.time}</Text>
              <View style={styles.lineDivider} />
              <Text style={styles.tagText}>{meal.tag.toUpperCase()}</Text>
            </View>

            {/* Main Card */}
            <View style={styles.mealCard}>
              {/* Image banner */}
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: meal.image }} 
                  style={styles.mealImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.mealContent}>
                <Text style={styles.mealDesc}>{meal.description}</Text>

                {/* Ingredients list */}
                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsLabel}>INGREDIENT PROTOCOL:</Text>
                  <View style={styles.ingredientsList}>
                    {meal.ingredients.map((ing, i) => (
                      <Text key={i} style={styles.ingredientItem}>
                        ▪ {ing.amount}{ing.unit} {ing.name}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Macro metrics table */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>P</Text>
                    <Text style={styles.metricVal}>{meal.nutrition.protein}g</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>F</Text>
                    <Text style={styles.metricVal}>{meal.nutrition.fat}g</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>C</Text>
                    <Text style={styles.metricVal}>{meal.nutrition.carbohydrates}g</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>KCAL</Text>
                    <Text style={[styles.metricVal, { color: COLORS.primary }]}>
                      {meal.nutrition.calories}
                    </Text>
                  </View>
                </View>

                {/* Performance Pairing */}
                {meal.pairing && (
                  <View style={styles.pairingContainer}>
                    <View style={styles.pairingIconBox}>
                      <Text style={styles.pairingIcon}>
                        {getPairingIcon(meal.pairing.icon)}
                      </Text>
                    </View>
                    <View style={styles.pairingTexts}>
                      <Text style={styles.pairingTitle}>{meal.pairing.name}</Text>
                      <Text style={styles.pairingDesc}>{meal.pairing.description}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveBtn}
        onPress={handleSaveProtocol}
        activeOpacity={0.9}
      >
        <Text style={styles.saveBtnText}>LOG PROTOCOL TO TRACKER</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: 50,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitleIcon: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: FONTS.display,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  titleSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: COLORS.black,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  dietBadgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: FONTS.display,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  dashboard: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: SPACING.xl,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  dashboardSub: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  dashboardVal: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
  },
  kcalUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: 'normal',
  },
  surgeBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  surgeText: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: 'bold',
  },
  macroBars: {
    gap: SPACING.md,
  },
  macroItem: {
    gap: 4,
  },
  macroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
  },
  macroValues: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  barBg: {
    height: 8,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  mealsList: {
    gap: SPACING.xl,
  },
  mealCardContainer: {
    gap: SPACING.xs,
  },
  timeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceHigh,
  },
  tagText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: COLORS.surfaceLow,
  },
  mealImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(19, 19, 19, 0.7)',
  },
  mealName: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  mealContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  mealDesc: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  ingredientsSection: {
    backgroundColor: COLORS.surfaceLow,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  ingredientsLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  ingredientsList: {
    gap: SPACING.xs,
  },
  ingredientItem: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.surfaceHigh,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  metricDivider: {
    width: 1,
    height: 25,
    backgroundColor: COLORS.surfaceHigh,
  },
  pairingContainer: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  pairingIconBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairingIcon: {
    fontSize: 20,
  },
  pairingTexts: {
    flex: 1,
    gap: 2,
  },
  pairingTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  pairingDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#AACC00',
    marginTop: SPACING.xxl,
  },
  saveBtnText: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
