import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ProfileEditScreen({ token, profile, onSaveSuccess, onCancel, baseUrl, isFirstTime }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-populate if editing existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age ? String(profile.age) : '');
      setGender(profile.gender || 'male');
      setWeightKg(profile.weightKg ? String(profile.weightKg) : '');
      setHeightCm(profile.heightCm ? String(profile.heightCm) : '');
    }
  }, [profile]);

  const handleSave = async () => {
    const tempErrors = {};
    if (!name) tempErrors.name = 'Name is required';
    if (!age) tempErrors.age = 'Age is required';
    if (!weightKg) tempErrors.weightKg = 'Weight is required';
    if (!heightCm) tempErrors.heightCm = 'Height is required';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          gender,
          weightKg: parseFloat(weightKg),
          heightCm: parseFloat(heightCm),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Profile Saved', 'Your profile details have been saved.');
        onSaveSuccess(data.profile);
      } else {
        Alert.alert('Save Failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.title}>{isFirstTime ? 'SETUP PROFILE' : 'EDIT PROFILE'}</Text>
          {!isFirstTime && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>DECLARE YOUR BODY MATRIX METRICS</Text>
        <View style={styles.accentBar} />
      </View>

      <View style={styles.form}>
        <Input
          label="FULL NAME"
          value={name}
          onChangeText={setName}
          placeholder="ENTER YOUR NAME"
          error={errors.name}
        />

        <View style={styles.inputRow}>
          <View style={styles.halfInput}>
            <Input
              label="AGE (years)"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 25"
              keyboardType="number-pad"
              error={errors.age}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="HEIGHT (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="e.g. 180"
              keyboardType="number-pad"
              error={errors.heightCm}
            />
          </View>
        </View>

        <Input
          label="WEIGHT (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="e.g. 85"
          keyboardType="numeric"
          error={errors.weightKg}
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

        <Button
          title="SAVE PROFILE"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.xxl,
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
  form: {
    width: '100%',
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
    marginTop: SPACING.md,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
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
  saveBtn: {
    marginTop: SPACING.xl,
  },
});
