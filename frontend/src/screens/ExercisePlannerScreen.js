import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import Svg, { Rect, Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import Button from '../components/Button';

// Muscle mapping
const SVG_ZONE_TO_MUSCLE = {
  // Front view zones
  'chest': 'chest',
  'shoulders-l': 'shoulders',
  'shoulders-r': 'shoulders',
  'biceps-l': 'biceps',
  'biceps-r': 'biceps',
  'core': 'core',
  'quads-l': 'legs',
  'quads-r': 'legs',
  // Back view zones
  'back-u': 'back',
  'back-l': 'back',
  'triceps-l': 'triceps',
  'triceps-r': 'triceps',
  'hamstrings-l': 'legs',
  'hamstrings-r': 'legs',
  'calves-l': 'legs',
  'calves-r': 'legs',
};

const EXTRA_CHIPS = [
  { id: 'cardio', label: 'CARDIO // ENDURANCE' },
  { id: 'flexibility', label: 'YOGA // FLEXIBILITY' },
  { id: 'full_body', label: 'FULL BODY PROTOCOL' }
];

export default function ExercisePlannerScreen({ token, baseUrl, onNavigate, onGenerateSuccess }) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [selectedMuscles, setSelectedMuscles] = useState([]); // array of muscleGroup strings
  const [age, setAge] = useState('25');
  const [level, setLevel] = useState('intermediate'); // 'beginner' | 'intermediate' | 'advanced' | 'athlete'
  const [mode, setMode] = useState('gym'); // 'home' | 'gym'
  const [goal, setGoal] = useState('muscle_gain'); // 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general_fitness'
  
  const [loading, setLoading] = useState(false);

  const handleMusclePress = (muscleKey) => {
    const muscleGroup = SVG_ZONE_TO_MUSCLE[muscleKey] || muscleKey;

    if (selectedMuscles.includes(muscleGroup)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscleGroup));
    } else {
      setSelectedMuscles([...selectedMuscles, muscleGroup]);
    }
  };

  const handleExtraChipPress = (chipId) => {
    if (selectedMuscles.includes(chipId)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== chipId));
    } else {
      setSelectedMuscles([...selectedMuscles, chipId]);
    }
  };

  const handleGenerate = async () => {
    if (selectedMuscles.length === 0) {
      Alert.alert('Action Required', 'Please select at least one muscle group or protocol zone.');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 90) {
      Alert.alert('Invalid Input', 'Please enter a valid age between 10 and 90.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/workout/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          muscleGroups: selectedMuscles,
          mode,
          level,
          age: ageNum,
          goal
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onGenerateSuccess(data.plan);
      } else {
        Alert.alert('Generation Failure', data.error || 'Failed to compile training protocol.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Connection Failure', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const isMuscleSelected = (muscleKey) => {
    const muscleGroup = SVG_ZONE_TO_MUSCLE[muscleKey] || muscleKey;
    return selectedMuscles.includes(muscleGroup);
  };

  const renderSVGSelector = () => {
    const isFront = view === 'front';

    return (
      <View style={styles.svgContainer}>
        <Svg width="100%" height="320" viewBox="0 0 200 320">
          {/* Cybernetic Grid background */}
          <Line x1="10" y1="20" x2="190" y2="20" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="10" y1="80" x2="190" y2="80" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="10" y1="140" x2="190" y2="140" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="10" y1="200" x2="190" y2="200" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="10" y1="260" x2="190" y2="260" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          
          <Line x1="40" y1="10" x2="40" y2="310" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="100" y1="10" x2="100" y2="310" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />
          <Line x1="160" y1="10" x2="160" y2="310" stroke="rgba(204, 255, 0, 0.04)" strokeWidth="1" />

          {/* Base human silhouette */}
          <Path
            d="M 100 15 C 110 15, 114 20, 114 30 C 114 40, 110 45, 105 47 L 106 50 L 125 52 C 133 52, 137 54, 139 58 L 149 105 C 151 112, 148 116, 142 114 L 134 110 L 142 150 C 144 158, 142 162, 136 162 L 128 152 L 131 205 L 138 270 C 140 280, 131 285, 124 285 L 112 280 L 105 225 L 100 225 L 95 225 L 88 280 L 76 285 C 69 285, 60 280, 62 270 L 69 205 L 72 152 L 64 162 C 58 162, 56 158, 58 150 L 66 110 L 58 114 C 52 116, 49 112, 51 105 L 61 58 C 63 54, 67 52, 75 52 L 94 50 L 95 47 C 90 45, 86 40, 86 30 C 86 20, 90 15, 100 15 Z"
            fill="#121212"
            stroke="rgba(204, 255, 0, 0.12)"
            strokeWidth="1.5"
          />

          {isFront ? (
            <G>
              {/* Shoulders */}
              <Path 
                d="M 75 46 C 68 48, 61 56, 64 68 C 66 74, 71 76, 75 70 Z"
                fill={isMuscleSelected('shoulders-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('shoulders-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('shoulders-l')}
              />
              <Path 
                d="M 125 46 C 132 48, 139 56, 136 68 C 134 74, 129 76, 125 70 Z"
                fill={isMuscleSelected('shoulders-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('shoulders-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('shoulders-r')}
              />

              {/* Chest */}
              <G onPress={() => handleMusclePress('chest')}>
                <Path 
                  d="M 98 48 L 78 48 C 77 62, 79 68, 98 71 Z" 
                  fill={isMuscleSelected('chest') ? COLORS.primary : COLORS.surface}
                  stroke={isMuscleSelected('chest') ? COLORS.primary : COLORS.outline}
                  strokeWidth="1.5"
                />
                <Path 
                  d="M 102 48 L 122 48 C 123 62, 121 68, 102 71 Z" 
                  fill={isMuscleSelected('chest') ? COLORS.primary : COLORS.surface}
                  stroke={isMuscleSelected('chest') ? COLORS.primary : COLORS.outline}
                  strokeWidth="1.5"
                />
              </G>
              
              {/* Biceps */}
              <Path 
                d="M 63 73 C 58 84, 57 96, 62 107 C 65 106, 68 96, 70 80 Z"
                fill={isMuscleSelected('biceps-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('biceps-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('biceps-l')}
              />
              <Path 
                d="M 137 73 C 142 84, 143 96, 138 107 C 135 106, 132 96, 130 80 Z"
                fill={isMuscleSelected('biceps-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('biceps-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('biceps-r')}
              />
              
              {/* Core / Abs */}
              <G onPress={() => handleMusclePress('core')}>
                <Path 
                  d="M 82 76 L 118 76 L 114 130 L 86 130 Z"
                  fill={isMuscleSelected('core') ? COLORS.primary : COLORS.surface}
                  stroke={isMuscleSelected('core') ? COLORS.primary : COLORS.outline}
                  strokeWidth="1.5"
                />
                <Line x1="100" y1="76" x2="100" y2="130" stroke={isMuscleSelected('core') ? COLORS.black : 'rgba(142, 147, 121, 0.4)'} strokeWidth="1" />
                <Line x1="84" y1="94" x2="116" y2="94" stroke={isMuscleSelected('core') ? COLORS.black : 'rgba(142, 147, 121, 0.4)'} strokeWidth="1" />
                <Line x1="85" y1="112" x2="115" y2="112" stroke={isMuscleSelected('core') ? COLORS.black : 'rgba(142, 147, 121, 0.4)'} strokeWidth="1" />
              </G>
              
              {/* Quads */}
              <Path 
                d="M 72 136 C 78 134, 96 134, 98 140 C 97 165, 95 190, 93 212 C 86 212, 76 204, 71 190 C 67 170, 69 150, 72 136 Z"
                fill={isMuscleSelected('quads-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('quads-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('quads-l')}
              />
              <Path 
                d="M 128 136 C 122 134, 104 134, 102 140 C 103 165, 105 190, 107 212 C 114 212, 124 204, 129 190 C 133 170, 131 150, 128 136 Z"
                fill={isMuscleSelected('quads-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('quads-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('quads-r')}
              />

              {/* Sci-Fi Callouts (Front) */}
              <G>
                <Line x1="70" y1="57" x2="30" y2="57" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="70" cy="57" r="2" fill={isMuscleSelected('shoulders-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="25" y="60" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">SHOULDERS</SvgText>

                <Line x1="60" y1="90" x2="25" y2="90" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="60" cy="90" r="2" fill={isMuscleSelected('biceps-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="20" y="93" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">BICEPS</SvgText>

                <Line x1="80" y1="175" x2="25" y2="175" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="80" cy="175" r="2" fill={isMuscleSelected('quads-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="20" y="178" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">QUADS</SvgText>

                <Line x1="110" y1="60" x2="170" y2="60" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="110" cy="60" r="2" fill={isMuscleSelected('chest') ? COLORS.primary : COLORS.outline} />
                <SvgText x="175" y="63" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="start">CHEST</SvgText>

                <Line x1="108" y1="103" x2="170" y2="103" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="108" cy="103" r="2" fill={isMuscleSelected('core') ? COLORS.primary : COLORS.outline} />
                <SvgText x="175" y="106" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="start">CORE</SvgText>
              </G>
            </G>
          ) : (
            <G>
              {/* Shoulders */}
              <Path 
                d="M 75 46 C 68 48, 61 56, 64 68 C 66 74, 71 76, 75 70 Z"
                fill={isMuscleSelected('shoulders-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('shoulders-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('shoulders-l')}
              />
              <Path 
                d="M 125 46 C 132 48, 139 56, 136 68 C 134 74, 129 76, 125 70 Z"
                fill={isMuscleSelected('shoulders-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('shoulders-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('shoulders-r')}
              />

              {/* Upper Back */}
              <G onPress={() => handleMusclePress('back-u')}>
                <Path 
                  d="M 98 48 L 76 52 C 73 68, 77 88, 98 106 Z"
                  fill={isMuscleSelected('back-u') ? COLORS.primary : COLORS.surface}
                  stroke={isMuscleSelected('back-u') ? COLORS.primary : COLORS.outline}
                  strokeWidth="1.5"
                />
                <Path 
                  d="M 102 48 L 124 52 C 127 68, 123 88, 102 106 Z"
                  fill={isMuscleSelected('back-u') ? COLORS.primary : COLORS.surface}
                  stroke={isMuscleSelected('back-u') ? COLORS.primary : COLORS.outline}
                  strokeWidth="1.5"
                />
              </G>
              
              {/* Lower Back */}
              <Path 
                d="M 84 108 L 116 108 L 112 134 L 88 134 Z"
                fill={isMuscleSelected('back-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('back-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('back-l')}
              />
              
              {/* Triceps */}
              <Path 
                d="M 63 73 C 58 84, 57 96, 62 107 C 65 106, 68 96, 70 80 Z"
                fill={isMuscleSelected('triceps-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('triceps-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('triceps-l')}
              />
              <Path 
                d="M 137 73 C 142 84, 143 96, 138 107 C 135 106, 132 96, 130 80 Z"
                fill={isMuscleSelected('triceps-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('triceps-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('triceps-r')}
              />
              
              {/* Hamstrings */}
              <Path 
                d="M 72 136 C 78 134, 96 134, 98 140 C 97 165, 95 190, 93 212 C 86 212, 76 204, 71 190 C 67 170, 69 150, 72 136 Z"
                fill={isMuscleSelected('hamstrings-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('hamstrings-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('hamstrings-l')}
              />
              <Path 
                d="M 128 136 C 122 134, 104 134, 102 140 C 103 165, 105 190, 107 212 C 114 212, 124 204, 129 190 C 133 170, 131 150, 128 136 Z"
                fill={isMuscleSelected('hamstrings-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('hamstrings-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('hamstrings-r')}
              />
              
              {/* Calves */}
              <Path 
                d="M 91 216 L 75 224 C 71 236, 73 256, 81 278 L 86 278 C 89 256, 91 236, 91 216 Z"
                fill={isMuscleSelected('calves-l') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('calves-l') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('calves-l')}
              />
              <Path 
                d="M 109 216 L 125 224 C 129 236, 127 256, 119 278 L 114 278 C 111 256, 109 236, 109 216 Z"
                fill={isMuscleSelected('calves-r') ? COLORS.primary : COLORS.surface}
                stroke={isMuscleSelected('calves-r') ? COLORS.primary : COLORS.outline}
                strokeWidth="1.5"
                onPress={() => handleMusclePress('calves-r')}
              />

              {/* Sci-Fi Callouts (Back) */}
              <G>
                <Line x1="60" y1="90" x2="25" y2="90" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="60" cy="90" r="2" fill={isMuscleSelected('triceps-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="20" y="93" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">TRICEPS</SvgText>

                <Line x1="80" y1="175" x2="25" y2="175" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="80" cy="175" r="2" fill={isMuscleSelected('hamstrings-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="20" y="178" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">HAMSTRINGS</SvgText>

                <Line x1="80" y1="247" x2="25" y2="247" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="80" cy="247" r="2" fill={isMuscleSelected('calves-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="20" y="250" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="end">CALVES</SvgText>

                <Line x1="110" y1="77" x2="170" y2="77" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="110" cy="77" r="2" fill={isMuscleSelected('back-u') ? COLORS.primary : COLORS.outline} />
                <SvgText x="175" y="80" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="start">UPPER BACK</SvgText>

                <Line x1="108" y1="121" x2="170" y2="121" stroke="rgba(204, 255, 0, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                <Circle cx="108" cy="121" r="2" fill={isMuscleSelected('back-l') ? COLORS.primary : COLORS.outline} />
                <SvgText x="175" y="124" fill={COLORS.textMuted} fontSize="9" fontFamily="monospace" textAnchor="start">LOWER BACK</SvgText>
              </G>
            </G>
          )}
        </Svg>

        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, isFront && styles.toggleBtnActive]}
            onPress={() => setView('front')}
          >
            <Text style={[styles.toggleText, isFront && styles.toggleTextActive]}>ANTERIOR (FRONT)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, !isFront && styles.toggleBtnActive]}
            onPress={() => setView('back')}
          >
            <Text style={[styles.toggleText, !isFront && styles.toggleTextActive]}>POSTERIOR (BACK)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
          <Text style={styles.backText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleIcon}>🏋️‍♂️</Text>
          <Text style={styles.headerTitle}>TRAIN HUB</Text>
        </View>
        <View style={styles.avatarPlaceholder} />
      </View>

      {/* Hero Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>EXERCISE{"\n"}ARCHITECT</Text>
        <Text style={styles.subtitle}>GRIND PROTOCOL // SELECTION MATRIX</Text>
      </View>

      {/* Interactive Silhouette */}
      <View style={styles.cardPanel}>
        <Text style={styles.label}>TARGET MUSCLE MAP (TAP TO SELECT)</Text>
        {renderSVGSelector()}
      </View>

      {/* Extra Chips Row */}
      <View style={styles.extraChipsSection}>
        <Text style={styles.label}>SPECIALTY PROTOCOLS</Text>
        <View style={styles.chipsContainer}>
          {EXTRA_CHIPS.map(chip => {
            const selected = selectedMuscles.includes(chip.id);
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => handleExtraChipPress(chip.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Indicator */}
      {selectedMuscles.length > 0 && (
        <View style={styles.selectedPanel}>
          <Text style={styles.label}>SELECTED TARGET ZONE PROTOCOLS</Text>
          <View style={styles.selectedRow}>
            {selectedMuscles.map(m => (
              <View key={m} style={styles.selectedTag}>
                <Text style={styles.selectedTagText}>{m.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setSelectedMuscles(selectedMuscles.filter(sm => sm !== m))}>
                  <Text style={styles.selectedTagRemove}> ×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Live Previews Removed per request */}

      {/* Plan Parameters Configuration Card */}
      <View style={styles.configPanel}>
        <Text style={[styles.label, styles.borderedLabel]}>SYSTEM PARAMETERS</Text>
        
        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>USER AGE</Text>
          <TextInput
            style={styles.ageInput}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        {/* Level */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>EXPERIENCE PROTOCOL</Text>
          <View style={styles.segmentedRow}>
            {['beginner', 'intermediate', 'advanced', 'athlete'].map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[styles.segmentBtn, level === lvl && styles.segmentBtnActive]}
                onPress={() => setLevel(lvl)}
              >
                <Text style={[styles.segmentText, level === lvl && styles.segmentTextActive]}>
                  {lvl.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Environment Mode */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>TRAINING ENVIRONMENT</Text>
          <View style={styles.segmentedRow}>
            {['home', 'gym'].map(md => (
              <TouchableOpacity
                key={md}
                style={[styles.segmentBtn, mode === md && styles.segmentBtnActive]}
                onPress={() => setMode(md)}
              >
                <Text style={[styles.segmentText, mode === md && styles.segmentTextActive]}>
                  {md.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FITNESS GOAL</Text>
          <View style={styles.segmentedRowWrap}>
            {[
              { id: 'muscle_gain', label: 'MUSCLE GAIN' },
              { id: 'weight_loss', label: 'WEIGHT LOSS' },
              { id: 'endurance', label: 'ENDURANCE' },
              { id: 'flexibility', label: 'FLEXIBILITY' },
              { id: 'general_fitness', label: 'GENERAL' },
            ].map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.segmentBtn, styles.segmentBtnWrap, goal === g.id && styles.segmentBtnActive]}
                onPress={() => setGoal(g.id)}
              >
                <Text style={[styles.segmentText, goal === g.id && styles.segmentTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* CTA Button */}
      <View style={styles.ctaSection}>
        <Button 
          title={loading ? "COMPILING SYSTEM..." : "GENERATE PROTOCOL"}
          onPress={handleGenerate}
          loading={loading}
        />
      </View>
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
  cardPanel: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  label: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  borderedLabel: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.md,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.surface,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  toggleTextActive: {
    color: COLORS.black,
  },
  extraChipsSection: {
    marginBottom: SPACING.xl,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  chipTextActive: {
    color: COLORS.black,
  },
  selectedPanel: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  selectedTag: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  selectedTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  selectedTagRemove: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  previewPanel: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: SPACING.xs,
  },
  previewList: {
    gap: SPACING.sm,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  previewCardMarker: {
    width: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  previewCardContent: {
    flex: 1,
  },
  previewName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  previewMeta: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  previewFallback: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    padding: SPACING.md,
  },
  configPanel: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  ageInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    color: COLORS.white,
    padding: SPACING.md,
    fontSize: 22,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  segmentedRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnWrap: {
    flex: 0,
    minWidth: '31%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.black,
  },
  ctaSection: {
    marginTop: SPACING.md,
  },
});
