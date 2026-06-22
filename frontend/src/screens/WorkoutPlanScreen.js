import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Linking,
  Image
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import Button from '../components/Button';

// WebView for native YouTube embedding
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.log('WebView not available');
  }
}

export default function WorkoutPlanScreen({ plan, baseUrl, token, onBack, onStartWorkout }) {
  const [activeDayIndex, setActiveDayIndex] = useState(0); // Index of selected day in schedule (0-6)
  const [expandedInstructions, setExpandedInstructions] = useState({}); // { exerciseId: boolean }
  const [videoLoading, setVideoLoading] = useState({}); // { exerciseId: boolean }
  const [videoIds, setVideoIds] = useState({}); // { exerciseId: string }
  const [activeVideo, setActiveVideo] = useState(null); // exerciseId currently showing video

  const schedule = plan?.schedule || [];
  const activeDay = schedule[activeDayIndex] || schedule[0];

  const handleToggleInstructions = (exId) => {
    setExpandedInstructions(prev => ({
      ...prev,
      [exId]: !prev[exId]
    }));
  };

  const handleWatchVideo = async (exercise) => {
    const exId = exercise._id || exercise.id;

    // If video is already showing, toggle it off
    if (activeVideo === exId) {
      setActiveVideo(null);
      return;
    }

    // Check if we already have the videoId in local state or in the exercise object
    const cachedId = videoIds[exId] || exercise.youtubeVideoId;
    if (cachedId) {
      setVideoIds(prev => ({ ...prev, [exId]: cachedId }));
      setActiveVideo(exId);
      return;
    }

    // Otherwise, lazy load it from API
    setVideoLoading(prev => ({ ...prev, [exId]: true }));
    try {
      const response = await fetch(`${baseUrl}/api/workout/exercises/${exId}/video`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success && data.videoId) {
        setVideoIds(prev => ({ ...prev, [exId]: data.videoId }));
        setActiveVideo(exId);
      } else {
        alert('Could not find video for this exercise.');
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching video tutorial.');
    } finally {
      setVideoLoading(prev => ({ ...prev, [exId]: false }));
    }
  };

  const weekdayShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleIcon}>⚡</Text>
          <Text style={styles.headerTitle}>MATRIX PLAN</Text>
        </View>
        <View style={styles.avatarPlaceholder} />
      </View>

      {/* Week Tab Bar */}
      <View style={styles.tabBar}>
        {schedule.map((day, idx) => {
          const isSelected = activeDayIndex === idx;
          const isRest = day.type === 'Rest Day';
          
          return (
            <TouchableOpacity
              key={day.dayNumber}
              style={[
                styles.tabBtn, 
                isSelected && styles.tabBtnActive,
                isRest && styles.tabBtnRest
              ]}
              onPress={() => {
                setActiveDayIndex(idx);
                setActiveVideo(null);
              }}
            >
              <Text style={[
                styles.tabText, 
                isSelected && styles.tabTextActive,
                isRest && styles.tabTextRest
              ]}>
                {weekdayShort[day.dayNumber - 1]}
              </Text>
              <View style={[styles.tabIndicator, isSelected && styles.tabIndicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Plan Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeDay ? (
          <View style={styles.dayPanel}>
            {/* Day Title */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{activeDay.dayName.toUpperCase()}</Text>
              <Text style={styles.dayType}>{activeDay.type.toUpperCase()}</Text>
            </View>

            {activeDay.type === 'Rest Day' ? (
              <View style={styles.restContainer}>
                <Text style={styles.restIcon}>☕</Text>
                <Text style={styles.restTitle}>RECOVERY PROTOCOL ACTIVE</Text>
                <Text style={styles.restSubtitle}>Muscles grow and repair during rest. Hydrate, focus on nutrition, and allow your nervous system to recover.</Text>
                <Text style={styles.restNote}>Active recovery (light walking/stretching) is permitted.</Text>
              </View>
            ) : (
              <View style={styles.workoutContainer}>
                {/* Warmup note */}
                <View style={styles.noteBanner}>
                  <Text style={styles.noteLabel}>WARMUP PROTOCOL</Text>
                  <Text style={styles.noteText}>{activeDay.warmupNote}</Text>
                </View>

                {/* Exercises list */}
                <Text style={styles.sectionLabel}>EXERCISE SEQUENCE ({activeDay.exercises.length} MOVES)</Text>
                
                {activeDay.exercises.map((item, index) => {
                  const ex = item.exercise;
                  const isExpanded = !!expandedInstructions[ex._id];
                  const isVidLoading = !!videoLoading[ex._id];
                  const hasVideo = activeVideo === ex._id;
                  const videoId = videoIds[ex._id];

                  return (
                    <View key={ex._id} style={styles.exerciseCard}>
                      <View style={styles.cardHeader}>
                        {/* Static image or Placeholder icon */}
                        <View style={styles.imageContainer}>
                          {ex.imageUrl ? (
                            Platform.OS === 'web' ? (
                              <img src={ex.imageUrl} style={styles.exerciseImageWeb} alt={ex.name} />
                            ) : (
                              <Image source={{ uri: ex.imageUrl }} style={{ width: 80, height: 80 }} resizeMode="cover" />
                            )
                          ) : (
                            <View style={styles.placeholderBox}>
                              <Text style={styles.placeholderIcon}>
                                {ex.muscleGroup === 'cardio' ? '🏃‍♂️' : (ex.muscleGroup === 'flexibility' ? '🧘‍♂️' : '💪')}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Exercise Name and details */}
                        <View style={styles.infoContainer}>
                          <Text style={styles.exerciseName}>{ex.name.toUpperCase()}</Text>
                          <Text style={styles.exerciseTags}>
                            {ex.muscleGroup.toUpperCase()} // {ex.equipment.toUpperCase()} // {ex.difficulty.toUpperCase()}
                          </Text>

                          {/* Loading targets row */}
                          <View style={styles.targetsRow}>
                            <View style={styles.targetItem}>
                              <Text style={styles.targetLabel}>SETS</Text>
                              <Text style={styles.targetValue}>{item.sets}</Text>
                            </View>
                            <View style={styles.targetDivider} />
                            <View style={styles.targetItem}>
                              {item.reps > 0 ? (
                                <>
                                  <Text style={styles.targetLabel}>REPS</Text>
                                  <Text style={styles.targetValue}>{item.reps}</Text>
                                </>
                              ) : (
                                <>
                                  <Text style={styles.targetLabel}>TIME</Text>
                                  <Text style={styles.targetValue}>{Math.round(item.durationSec / 60)}M</Text>
                                </>
                              )}
                            </View>
                            <View style={styles.targetDivider} />
                            <View style={styles.targetItem}>
                              <Text style={styles.targetLabel}>REST</Text>
                              <Text style={styles.targetValue}>{item.restSec}S</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* YouTube Video Section */}
                      {hasVideo && videoId && (
                        <View style={styles.videoContainer}>
                          {Platform.OS === 'web' ? (
                            <iframe 
                              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`}
                              style={styles.youtubeIframe}
                              frameBorder="0"
                              allowFullScreen
                            />
                          ) : WebView ? (
                            <WebView
                              source={{ uri: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1` }}
                              style={{ flex: 1 }}
                              allowsFullscreenVideo={true}
                              allowsInlineMediaPlayback={true}
                              javaScriptEnabled={true}
                              domStorageEnabled={true}
                              mediaPlaybackRequiresUserAction={false}
                              userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                              originWhitelist={['*']}
                            />
                          ) : (
                            <TouchableOpacity
                              style={styles.mobileVideoPlaceholder}
                              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
                            >
                              <Text style={styles.mobileVideoPlayIcon}>▶</Text>
                              <Text style={styles.mobileVideoText}>TAP TO OPEN IN YOUTUBE</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Collapsible description instructions */}
                      {isExpanded && (
                        <View style={styles.instructionsContainer}>
                          <Text style={styles.instructionsLabel}>EXECUTION DETAILS</Text>
                          <Text style={styles.instructionsText}>
                            {ex.description || 'No execution instructions provided. Perform with proper controlled form.'}
                          </Text>
                        </View>
                      )}

                      {/* Action buttons footer */}
                      <View style={styles.cardActions}>
                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => handleWatchVideo(ex)}
                          disabled={isVidLoading}
                        >
                          {isVidLoading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Text style={[styles.actionBtnText, hasVideo && styles.actionBtnTextActive]}>
                              {hasVideo ? '✕ CLOSE VIDEO' : '▶ WATCH VIDEO'}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => handleToggleInstructions(ex._id)}
                        >
                          <Text style={styles.actionBtnText}>
                            {isExpanded ? '▲ HIDE DETAIL' : '≡ INSTRUCTIONS'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Cooldown note */}
                <View style={styles.noteBanner}>
                  <Text style={styles.noteLabel}>COOLDOWN PROTOCOL</Text>
                  <Text style={styles.noteText}>{activeDay.cooldownNote}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>Generating weekly matrices...</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: SPACING.xs,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabBtnRest: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabTextRest: {
    color: COLORS.outline,
  },
  tabIndicator: {
    height: 2,
    width: 20,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  tabIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  dayPanel: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: SPACING.xs,
  },
  dayName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    fontStyle: 'italic',
  },
  dayType: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  restContainer: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  restIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  restSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  restNote: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 10,
    textAlign: 'center',
  },
  workoutContainer: {
    gap: SPACING.xl,
  },
  noteBanner: {
    backgroundColor: COLORS.surfaceLow,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  noteLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  noteText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  exerciseCard: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exerciseImageWeb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  exerciseTags: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 9,
    marginTop: 4,
    opacity: 0.8,
  },
  targetsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  targetItem: {
    alignItems: 'baseline',
  },
  targetLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 8,
    marginRight: 4,
  },
  targetValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  targetDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.outlineVariant,
    marginHorizontal: SPACING.md,
  },
  videoContainer: {
    marginTop: SPACING.md,
    width: '100%',
    height: 200,
    backgroundColor: COLORS.black,
  },
  youtubeIframe: {
    width: '100%',
    height: '100%',
  },
  mobileVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileVideoText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 8,
  },
  mobileVideoPlayIcon: {
    color: COLORS.primary,
    fontSize: 36,
  },
  instructionsContainer: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceHigh,
    paddingTop: SPACING.md,
  },
  instructionsLabel: {
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    fontSize: 8,
    marginBottom: 4,
  },
  instructionsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceHigh,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: COLORS.textMuted,
  },
  actionBtnTextActive: {
    color: COLORS.primary,
  },
  actionSection: {
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
