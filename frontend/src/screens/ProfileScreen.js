import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ProfileScreen({ token, onCalculationSuccess, onLogout, baseUrl, hasTargets, onCancel, profile }) {
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('lose');
  const [loading, setLoading] = useState(false);

  // Sync state if profile prop changes
  useEffect(() => {
    if (profile) {
      setAge(profile.age ? String(profile.age) : '');
      setGender(profile.gender || 'male');
      setHeightCm(profile.heightCm ? String(profile.heightCm) : '');
      setWeightKg(profile.weightKg ? String(profile.weightKg) : '');
    }
  }, [profile]);

  const activityOptions = [
    { label: 'SEDENTARY', value: 'sedentary', desc: 'Little to no exercise' },
    { label: 'LIGHT', value: 'light', desc: '1-3 days/week exercise' },
    { label: 'MODERATE', value: 'moderate', desc: '3-5 days/week exercise' },
    { label: 'ACTIVE', value: 'active', desc: '6-7 days/week intense exercise' },
    { label: 'VERY ACTIVE', value: 'very_active', desc: 'Daily athlete / physical job' },
  ];

  const goalOptions = [
    { label: 'WEIGHT LOSS', value: 'lose', desc: 'Deficit for fat loss' },
    { label: 'MAINTENANCE', value: 'maintain', desc: 'Keep current weight' },
    { label: 'WEIGHT GAIN', value: 'gain', desc: 'Surplus for muscle building' },
  ];

  const handleCalculate = async () => {
    if (!age || !heightCm || !weightKg) {
      Alert.alert('Incomplete Data', 'Please fill in age, height, and weight.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/calculator/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: parseInt(age),
          gender,
          heightCm: parseFloat(heightCm),
          weightKg: parseFloat(weightKg),
          activityLevel,
          goal,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onCalculationSuccess(data.data.targets, data.data.profile);
      } else {
        Alert.alert('Calculation Error', data.error || 'Failed to compute calorie targets');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to communicate with server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.title}>METRICS</Text>
          {hasTargets && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>SETUP YOUR PERFORMANCE PROFILE</Text>
        <View style={styles.accentBar} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BIOMETRICS</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Input
              label="AGE (years)"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 25"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="HEIGHT (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="e.g. 175"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Input
          label="WEIGHT (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="e.g. 70"
          keyboardType="numeric"
        />

        <Text style={styles.label}>GENDER</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectorItem, gender === 'male' && styles.selectorItemSelected]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.selectorItemText, gender === 'male' && styles.selectorItemTextSelected]}>MALE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorItem, gender === 'female' && styles.selectorItemSelected]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.selectorItemText, gender === 'female' && styles.selectorItemTextSelected]}>FEMALE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVITY LEVEL</Text>
        {activityOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.cardOption, activityLevel === opt.value && styles.cardOptionSelected]}
            onPress={() => setActivityLevel(opt.value)}
          >
            <View>
              <Text style={[styles.cardLabel, activityLevel === opt.value && styles.cardLabelSelected]}>{opt.label}</Text>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FITNESS GOAL</Text>
        {goalOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.cardOption, goal === opt.value && styles.cardOptionSelected]}
            onPress={() => setGoal(opt.value)}
          >
            <View>
              <Text style={[styles.cardLabel, goal === opt.value && styles.cardLabelSelected]}>{opt.label}</Text>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="CALCULATE TARGETS"
        onPress={handleCalculate}
        loading={loading}
        style={styles.calcBtn}
      />
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
  section: {
    marginBottom: SPACING.xl,
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  selectorItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  selectorItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  selectorItemText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  selectorItemTextSelected: {
    color: COLORS.primary,
  },
  cardOption: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  cardLabelSelected: {
    color: COLORS.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  calcBtn: {
    marginTop: SPACING.xl,
    marginBottom: 40,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
