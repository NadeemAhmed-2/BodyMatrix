import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';

export default function MealConfigScreen({ profile, targets, token, baseUrl, onGenerateSuccess, onNavigate }) {
  const [calorieMode, setCalorieMode] = useState('LOW'); // 'LOW' or 'HIGH'
  const [calories, setCalories] = useState('2000');
  const [mealsPerDay, setMealsPerDay] = useState(3); // 1, 2, 3, 4
  const [diet, setDiet] = useState('vegetarian'); // 'vegan' | 'vegetarian' | 'non_vegetarian' | 'pescatarian' | 'gluten_free' | 'keto'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get calorie target based on goal and calorie mode
  useEffect(() => {
    // Determine default calories
    const weightLossCals = targets?.weightLossCalories || 1800;
    const weightGainCals = targets?.weightGainCalories || 2800;
    const maintenanceCals = targets?.maintenanceCalories || 2200;

    if (calorieMode === 'LOW') {
      // Pre-fill with weight loss target if exists, otherwise maintenance * 0.85
      setCalories(String(weightLossCals));
    } else {
      // Pre-fill with weight gain target if exists, otherwise maintenance * 1.15
      setCalories(String(weightGainCals));
    }
  }, [calorieMode, targets]);

  const handleGenerate = async () => {
    const targetCalsNum = parseInt(calories);
    if (isNaN(targetCalsNum) || targetCalsNum < 800 || targetCalsNum > 8000) {
      Alert.alert('Invalid Input', 'Please enter a target calorie value between 800 and 8000 KCAL.');
      return;
    }

    setLoading(true);
    setProgress(0);

    let t1, t2, t3;
    t1 = setTimeout(() => setProgress(25), 1500);
    t2 = setTimeout(() => setProgress(50), 3000);
    t3 = setTimeout(() => setProgress(85), 5500);

    try {
      const response = await fetch(`${baseUrl}/api/meal/plan/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetCalories: targetCalsNum,
          diet: diet,
          mealsPerDay: mealsPerDay
        })
      });

      const data = await response.json();
      if (response.ok) {
        setProgress(100);
        setTimeout(() => {
          onGenerateSuccess(data);
        }, 400);
      } else {
        Alert.alert('Generation Error', data.error || 'Failed to generate meal plan. Please try again.');
      }
    } catch (error) {
      console.error('Meal generate error:', error);
      Alert.alert('Connection Failed', 'Could not connect to server. Ensure your backend is running.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
    }
  };

  const dietOptions = [
    { id: 'vegetarian', label: 'VEG', subLabel: 'VEGETARIAN' },
    { id: 'non_vegetarian', label: 'NON-VEG', subLabel: 'NON-VEGETARIAN' },
  ];

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Modal
        transparent={true}
        animationType="fade"
        visible={loading}
        onRequestClose={() => {}}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.loadingText}>YOUR MEAL IS GETTING READY</Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleIcon}>⚡</Text>
            <Text style={styles.headerTitle}>FUEL & FLOW</Text>
          </View>
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* Section Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>NUTRITION{"\n"}ARCHITECTURE</Text>
          <Text style={styles.subtitle}>MEAL LAB // SYSTEM CONFIGURATION</Text>
        </View>

        {/* Calorie Target Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.label}>TARGET CALORIES</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity 
                style={[styles.modeBtn, calorieMode === 'LOW' && styles.modeBtnActive]}
                onPress={() => setCalorieMode('LOW')}
              >
                <Text style={[styles.modeText, calorieMode === 'LOW' && styles.modeTextActive]}>LOW</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeBtn, calorieMode === 'HIGH' && styles.modeBtnActive]}
                onPress={() => setCalorieMode('HIGH')}
              >
                <Text style={[styles.modeText, calorieMode === 'HIGH' && styles.modeTextActive]}>HIGH</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.calInput}
              value={calories}
              onChangeText={setCalories}
              placeholder="0000"
              placeholderTextColor={COLORS.surfaceHigh}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.calUnit}>KCAL</Text>
          </View>
          <View style={styles.inputUnderline} />
        </View>

        {/* Meal Counts */}
        <View style={styles.section}>
          <Text style={[styles.label, styles.borderedLabel]}>NUMBER OF MEALS PER DAY</Text>
          <View style={styles.grid}>
            {[
              { id: 1, val: '01', sub: 'SOLO' },
              { id: 2, val: '02', sub: 'DUAL' },
              { id: 3, val: '03', sub: 'TRIAD' },
              { id: 4, val: '04+', sub: 'EXPERT' }
            ].map(m => {
              const active = mealsPerDay === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.gridTile, active && styles.gridTileActive]}
                  onPress={() => setMealsPerDay(m.id)}
                >
                  <Text style={[styles.tileVal, active && styles.tileTextActive]}>{m.val}</Text>
                  <Text style={[styles.tileSub, active && styles.tileTextActive]}>{m.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dietary Profiles */}
        <View style={styles.section}>
          <Text style={[styles.label, styles.borderedLabel]}>DIETARY PROFILE</Text>
          <View style={[styles.grid, { gridTemplateColumns: 'repeat(2, 1fr)' }]}>
            {dietOptions.map(option => {
              const active = diet === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.gridTile, styles.dietTile, active && styles.gridTileActive]}
                  onPress={() => setDiet(option.id)}
                >
                  <Text style={[styles.tileVal, styles.dietVal, active && styles.tileTextActive]}>{option.label}</Text>
                  <Text style={[styles.tileSub, active && styles.tileTextActive]}>{option.subLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.generateBtn, loading && styles.generateBtnLoading]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.generateBtnText}>
              {loading ? 'GENERATING...' : 'GENERATE PLAN'}
            </Text>
          </TouchableOpacity>
          <Text style={{
            color: COLORS.textMuted,
            fontFamily: 'monospace',
            fontSize: 9,
            textAlign: 'center',
            marginTop: 6,
            letterSpacing: 1.5
          }}>
            TARGET ±100 KCAL TOLERANCE
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loaderCard: {
    width: '85%',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    borderRadius: 8,
  },
  spinner: {
    marginBottom: SPACING.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.white,
    fontFamily: FONTS.display,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  progressContainer: {
    height: 6,
    width: '100%',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressPct: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
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
  title: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 40,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  label: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  borderedLabel: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 2,
  },
  modeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.textMuted,
  },
  modeTextActive: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    height: 90,
  },
  calInput: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.primary,
    padding: 0,
    margin: 0,
    width: '70%',
    lineHeight: 80,
  },
  calUnit: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.textMuted,
    opacity: 0.3,
    marginBottom: SPACING.sm,
  },
  inputUnderline: {
    height: 2,
    backgroundColor: COLORS.outlineVariant,
    marginTop: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridTile: {
    width: '48%',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  gridTileActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tileVal: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  tileSub: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  tileTextActive: {
    color: COLORS.black,
  },
  dietTile: {
    width: '48%',
    paddingVertical: SPACING.md,
  },
  dietVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  actionSection: {
    marginTop: SPACING.lg,
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#AACC00',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  generateBtnLoading: {
    backgroundColor: COLORS.surfaceHigh,
    borderColor: COLORS.surfaceHigh,
    borderBottomColor: COLORS.surfaceLow,
  },
  generateBtnText: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});
