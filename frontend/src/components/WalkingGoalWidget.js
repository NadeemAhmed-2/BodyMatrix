import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING } from '../styles/theme';

export default function WalkingGoalWidget({ calorieTarget }) {
  const [stepsToday, setStepsToday] = useState(4200); // Default placeholder starting value
  const [manualInput, setManualInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Calorie to step calculations
  const targetCals = calorieTarget || 2000;
  const stepsNeeded = Math.round(targetCals / 0.04);
  const kmNeeded = parseFloat((stepsNeeded / 1312).toFixed(1));
  
  // Calculate active statistics
  const kmToday = parseFloat((stepsToday / 1312).toFixed(1));
  const kcalBurned = Math.round(stepsToday * 0.04);
  
  const percentage = Math.min(1.0, stepsToday / stepsNeeded);
  
  // SVG circular properties
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - percentage * circumference;

  const handleUpdateSteps = () => {
    const inputSteps = parseInt(manualInput);
    if (!isNaN(inputSteps) && inputSteps >= 0) {
      setStepsToday(inputSteps);
      setManualInput('');
      setShowInput(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>DIAGNOSTIC // PEDOMETER WIDGET</Text>
      
      <View style={styles.cardContent}>
        {/* Progress Ring */}
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(204, 255, 0, 0.1)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground Progress Ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>
              {Math.round(percentage * 100)}%
            </Text>
          </View>
        </View>

        {/* Text Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.stepsText}>
            {stepsToday.toLocaleString()} / <Text style={styles.targetStepsText}>{stepsNeeded.toLocaleString()}</Text>
          </Text>
          <Text style={styles.subtext}>STEPS PROTOCOL COMPLETED</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.metricText}>
            📍 {kmToday} KM · 🔥 {kcalBurned} KCAL BURNED
          </Text>

          {/* Web Manual Step Updater */}
          {Platform.OS === 'web' && (
            <View style={styles.webActionContainer}>
              {showInput ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={manualInput}
                    onChangeText={setManualInput}
                    placeholder="New Steps..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateSteps}>
                    <Text style={styles.submitBtnText}>SET</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInput(false)}>
                    <Text style={styles.cancelBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.updateLink} onPress={() => setShowInput(true)}>
                  <Text style={styles.updateLinkText}>[ MANUAL STEP OVERRIDE ]</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  headerLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
  },
  ringContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  statsContainer: {
    flex: 1,
  },
  stepsText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },
  targetStepsText: {
    color: COLORS.textMuted,
    fontWeight: 'normal',
    fontSize: 14,
  },
  subtext: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: SPACING.sm,
  },
  metricText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  webActionContainer: {
    marginTop: SPACING.sm,
  },
  updateLink: {
    paddingVertical: 4,
  },
  updateLinkText: {
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'monospace',
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: 90,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  submitBtnText: {
    color: COLORS.black,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingHorizontal: 6,
  },
  cancelBtnText: {
    color: COLORS.error,
    fontSize: 12,
  },
});
