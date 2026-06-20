import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, Platform, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme & Screens
import { COLORS, SPACING } from './src/styles/theme';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HomeScreen from './src/screens/HomeScreen';
import MeScreen from './src/screens/MeScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import MealConfigScreen from './src/screens/MealConfigScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import ExercisePlannerScreen from './src/screens/ExercisePlannerScreen';
import WorkoutPlanScreen from './src/screens/WorkoutPlanScreen';
import Button from './src/components/Button';

// Configure server API base URL
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5001`;
  }
  // Default to localhost for emulator, can be replaced by computer's IP
  return 'http://localhost:5001';
};

const BASE_URL = getBaseUrl();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('Landing'); // 'Landing' | 'Login' | 'Register' | 'Verify' | 'Profile' | 'Results' | 'Home' | 'TrainHubPlaceholder' | 'MealConfig' | 'MealPlan'
  const [targets, setTargets] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        const profileDataStr = await AsyncStorage.getItem('profileData');

        if (userToken && userDataStr) {
          setToken(userToken);
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          if (profileDataStr) {
            setProfileData(JSON.parse(profileDataStr));
          }

          // Verify token and fetch latest user details
          const response = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
          });

          const data = await response.json();
          if (response.ok && data.success) {
            setUser(data.user);
            // If user has calculated targets already, load them
            if (data.user.targets && data.user.targets.calculatedAt) {
              setTargets(data.user.targets);
              setProfile(data.user.profile);
            }
            if (data.profile) {
              setProfileData(data.profile);
              await AsyncStorage.setItem('profileData', JSON.stringify(data.profile));
              setScreen('Home');
            } else {
              setScreen('ProfileEdit');
            }
          } else {
            // Token invalid or expired
            await logout();
          }
        } else {
          setScreen('Landing');
        }
      } catch (e) {
        console.error('Failed to load login state', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const handleLoginSuccess = (userToken, userData, userProfile) => {
    setToken(userToken);
    setUser(userData);
    if (userData.targets && userData.targets.calculatedAt) {
      setTargets(userData.targets);
      setProfile(userData.profile);
    }
    if (userProfile) {
      setProfileData(userProfile);
      setScreen('Home');
    } else {
      setScreen('ProfileEdit');
    }
  };

  const handleVerificationSuccess = async (userToken, userData, userProfile) => {
    setToken(userToken);
    setUser(userData);
    await AsyncStorage.setItem('userToken', userToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    if (userData.targets && userData.targets.calculatedAt) {
      setTargets(userData.targets);
      setProfile(userData.profile);
    }
    if (userProfile) {
      setProfileData(userProfile);
      await AsyncStorage.setItem('profileData', JSON.stringify(userProfile));
      setScreen('Home');
    } else {
      setScreen('ProfileEdit');
    }
  };

  const handleProfileSaveSuccess = async (newProfile) => {
    setProfileData(newProfile);
    await AsyncStorage.setItem('profileData', JSON.stringify(newProfile));
    setScreen('Home');
  };

  const handleCalculationSuccess = (calculatedTargets, userProfile) => {
    setTargets(calculatedTargets);
    setProfile(userProfile);
    // Update local user state immediately so MeScreen has latest data
    setUser(prev => prev ? { ...prev, profile: userProfile, targets: calculatedTargets } : null);
    setScreen('Results');
  };

  const handleNavigate = async (targetScreen, params = {}) => {
    if (params.email) {
      setVerifyEmail(params.email);
    }
    if (targetScreen === 'TrainHubPlaceholder') {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/api/workout/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success && data.plan) {
          setWorkoutPlan(data.plan);
          setScreen('WorkoutPlanView');
        } else {
          setScreen('WorkoutPlanner');
        }
      } catch (err) {
        setScreen('WorkoutPlanner');
      } finally {
        setLoading(false);
      }
      return;
    }
    setScreen(targetScreen);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('profileData');
      setToken(null);
      setUser(null);
      setTargets(null);
      setProfile(null);
      setProfileData(null);
      setScreen('Landing');
    } catch (e) {
      console.error(e);
    }
  };

  // State-based routing
  const renderScreen = () => {
    switch (screen) {
      case 'Landing':
        return <LandingScreen onNavigate={handleNavigate} />;
      case 'Login':
        return (
          <LoginScreen
            onNavigate={handleNavigate}
            onLoginSuccess={handleLoginSuccess}
            baseUrl={BASE_URL}
          />
        );
      case 'Register':
        return (
          <RegisterScreen
            onNavigate={handleNavigate}
            onLoginSuccess={handleLoginSuccess}
            baseUrl={BASE_URL}
          />
        );
      case 'Verify':
        return (
          <VerifyScreen
            email={verifyEmail}
            onNavigate={handleNavigate}
            onVerificationSuccess={handleVerificationSuccess}
            baseUrl={BASE_URL}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            token={token}
            onCalculationSuccess={handleCalculationSuccess}
            onLogout={logout}
            baseUrl={BASE_URL}
            hasTargets={!!targets}
            onCancel={() => setScreen('Me')}
            profile={profileData}
          />
        );
      case 'Results':
        return (
          <ResultsScreen
            targets={targets}
            profile={profile}
            onRecalculate={() => setScreen('Profile')}
            onLogout={logout}
          />
        );
      case 'Me':
        return (
          <MeScreen
            user={user}
            profile={profileData}
            onEditProfile={() => setScreen('ProfileEdit')}
            onLogout={logout}
          />
        );
      case 'ProfileEdit':
        return (
          <ProfileEditScreen
            token={token}
            profile={profileData}
            onSaveSuccess={handleProfileSaveSuccess}
            onCancel={() => setScreen('Me')}
            baseUrl={BASE_URL}
            isFirstTime={!profileData}
          />
        );
      case 'Home':
        return (
          <HomeScreen
            targets={targets}
            profile={profile}
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        );
      case 'TrainHubPlaceholder':
      case 'WorkoutPlanner':
        return (
          <ExercisePlannerScreen
            token={token}
            baseUrl={BASE_URL}
            onNavigate={handleNavigate}
            onGenerateSuccess={(planData) => {
              setWorkoutPlan(planData);
              setScreen('WorkoutPlanView');
            }}
          />
        );
      case 'WorkoutPlanView':
        return (
          <WorkoutPlanScreen
            plan={workoutPlan}
            baseUrl={BASE_URL}
            token={token}
            onBack={() => setScreen('WorkoutPlanner')}
          />
        );
      case 'MealConfig':
        return (
          <MealConfigScreen
            profile={profileData}
            targets={targets}
            token={token}
            baseUrl={BASE_URL}
            onGenerateSuccess={(planData) => {
              setMealPlan(planData);
              setScreen('MealPlan');
            }}
            onNavigate={handleNavigate}
          />
        );
      case 'MealPlan':
        return (
          <MealPlanScreen
            plan={mealPlan}
            profile={profileData}
            targets={targets}
            onBack={() => setScreen('MealConfig')}
            onSave={() => setScreen('Home')}
          />
        );
      default:
        return <LandingScreen onNavigate={handleNavigate} />;
    }
  };

  const showBottomNav = token && profileData && ['Home', 'Results', 'Profile', 'Me', 'TrainHubPlaceholder', 'MealConfig', 'MealPlan', 'ProfileEdit', 'WorkoutPlanner', 'WorkoutPlanView'].includes(screen);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>
      {showBottomNav && (
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={[styles.navItem, screen === 'Home' && styles.navItemActive]} 
            onPress={() => setScreen('Home')}
          >
            <Text style={[styles.navIcon, screen === 'Home' && styles.navIconActive]}>🏠</Text>
            <Text style={[styles.navText, screen === 'Home' && styles.navTextActive]}>HOME</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, (screen === 'Results' || screen === 'Profile') && styles.navItemActive]} 
            onPress={() => setScreen('Results')}
          >
            <Text style={[styles.navIcon, (screen === 'Results' || screen === 'Profile') && styles.navIconActive]}>🧮</Text>
            <Text style={[styles.navText, (screen === 'Results' || screen === 'Profile') && styles.navTextActive]}>CALC</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, ['TrainHubPlaceholder', 'WorkoutPlanner', 'WorkoutPlanView'].includes(screen) && styles.navItemActive]} 
            onPress={async () => {
              setLoading(true);
              try {
                const response = await fetch(`${BASE_URL}/api/workout/active`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                const data = await response.json();
                if (response.ok && data.success && data.plan) {
                  setWorkoutPlan(data.plan);
                  setScreen('WorkoutPlanView');
                } else {
                  setScreen('WorkoutPlanner');
                }
              } catch (err) {
                setScreen('WorkoutPlanner');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={[styles.navIcon, ['TrainHubPlaceholder', 'WorkoutPlanner', 'WorkoutPlanView'].includes(screen) && styles.navIconActive]}>🏋️‍♂️</Text>
            <Text style={[styles.navText, ['TrainHubPlaceholder', 'WorkoutPlanner', 'WorkoutPlanView'].includes(screen) && styles.navTextActive]}>TRAIN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, ['MealConfig', 'MealPlan'].includes(screen) && styles.navItemActive]} 
            onPress={() => setScreen('MealConfig')}
          >
            <Text style={[styles.navIcon, ['MealConfig', 'MealPlan'].includes(screen) && styles.navIconActive]}>🥗</Text>
            <Text style={[styles.navText, ['MealConfig', 'MealPlan'].includes(screen) && styles.navTextActive]}>FUEL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, screen === 'Me' && styles.navItemActive]} 
            onPress={() => setScreen('Me')}
          >
            <Text style={[styles.navIcon, screen === 'Me' && styles.navIconActive]}>👤</Text>
            <Text style={[styles.navText, screen === 'Me' && styles.navTextActive]}>ME</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: COLORS.surfaceLow,
    borderTopWidth: 2,
    borderTopColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    flex: 1,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  navIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  navIconActive: {
    color: COLORS.primary,
    opacity: 1,
  },
  navText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 1,
    opacity: 0.6,
  },
  navTextActive: {
    color: COLORS.primary,
    opacity: 1,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  placeholderSubtitle: {
    fontFamily: 'monospace',
    color: COLORS.primary,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  placeholderBar: {
    height: 4,
    width: 60,
    backgroundColor: COLORS.primary,
    marginVertical: SPACING.xl,
  },
  placeholderText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
  placeholderSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: SPACING.xxl,
  },
  placeholderBtn: {
    width: 200,
  },
});
