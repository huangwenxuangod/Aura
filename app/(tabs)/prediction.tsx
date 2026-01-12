import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { createPrediction } from '@/services/prediction.service';
import { STAKE, QUICK_DEADLINES } from '@/lib/constants';
import { formatCredits, addDays, addHours } from '@/lib/utils';

export default function CreatePredictionScreen() {
  const router = useRouter();
  const { user, currentPrediction, recovery, fetchCurrentPrediction, fetchUser } = useUserStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [stake, setStake] = useState(STAKE.DEFAULT);
  const [stakeInput, setStakeInput] = useState(STAKE.DEFAULT.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const isInRecovery = recovery && recovery.status === 'IN_PROGRESS';
  const hasActivePrediction = !!currentPrediction;
  const maxStake = Math.min(user?.credit_balance || 0, STAKE.MAX);
  const canCreate = !hasActivePrediction && (isInRecovery || (user?.credit_balance || 0) >= STAKE.MIN);

  // Quick deadline options
  const quickOptions = useMemo(() => [
    { label: '1 Day', value: addDays(new Date(), 1), icon: '⚡' },
    { label: '7 Days', value: addDays(new Date(), 7), icon: '📅' },
    { label: '1 Month', value: addDays(new Date(), 30), icon: '🗓️' },
  ], []);

  const handleStakeChange = (value: number) => {
    const roundedValue = Math.round(value);
    setStake(roundedValue);
    setStakeInput(roundedValue.toString());
  };

  const handleStakeInputChange = (text: string) => {
    setStakeInput(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= STAKE.MIN && numValue <= maxStake) {
      setStake(numValue);
    }
  };

  const handleStakeInputBlur = () => {
    const numValue = parseInt(stakeInput, 10);
    if (isNaN(numValue) || numValue < STAKE.MIN) {
      setStake(STAKE.MIN);
      setStakeInput(STAKE.MIN.toString());
    } else if (numValue > maxStake) {
      setStake(maxStake);
      setStakeInput(maxStake.toString());
    } else {
      setStake(numValue);
      setStakeInput(numValue.toString());
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDeadline = new Date(deadline);
      newDeadline.setFullYear(selectedDate.getFullYear());
      newDeadline.setMonth(selectedDate.getMonth());
      newDeadline.setDate(selectedDate.getDate());
      setDeadline(newDeadline);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDeadline = new Date(deadline);
      newDeadline.setHours(selectedTime.getHours());
      newDeadline.setMinutes(selectedTime.getMinutes());
      setDeadline(newDeadline);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a prediction title' });
      return;
    }

    if (deadline <= new Date()) {
      Toast.show({ type: 'error', text1: 'Deadline must be in the future' });
      return;
    }

    if (!isInRecovery && stake > (user?.credit_balance || 0)) {
      Toast.show({ type: 'error', text1: 'Insufficient credits' });
      return;
    }

    setIsLoading(true);
    try {
      const prediction = await createPrediction({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline.toISOString(),
        stake: isInRecovery ? 0 : stake,
        isRecovery: isInRecovery ?? false,
      });

      await Promise.all([fetchCurrentPrediction(), fetchUser()]);

      Toast.show({
        type: 'success',
        text1: 'Prediction created!',
        text2: isInRecovery ? 'Continue your recovery journey' : `${stake} credits staked`,
      });

      router.replace(`/(screens)/prediction/${prediction.id}`);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create prediction',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hasActivePrediction) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.1)', 'transparent']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                style={styles.errorIconGradient}
              >
                <Ionicons name="flag" size={44} color="#f59e0b" />
              </LinearGradient>
            </View>
            <Text style={styles.errorTitle}>Active Prediction Exists</Text>
            <Text style={styles.errorDesc}>
              You can only have one active prediction at a time. Complete or cancel your current prediction first.
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/prediction/${currentPrediction.id}`)}
              style={styles.errorButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#c084fc', '#a855f7', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>View Current Prediction</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Aurora Background */}
      <View style={styles.auroraContainer}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.12)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb1]}
        />
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.1)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb2]}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isInRecovery ? 'Recovery Prediction' : 'Create Prediction'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isInRecovery
                  ? `Need ${2 - (recovery.success_count || 0)} more successes to recover ${formatCredits(recovery.original_stake)} credits`
                  : 'Predict your behavior and stake your commitment'}
              </Text>
            </View>

            {/* Recovery Banner */}
            {isInRecovery && (
              <View style={styles.recoveryBanner}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.05)']}
                  style={styles.recoveryGradient}
                >
                  <View style={styles.recoveryIconContainer}>
                    <Ionicons name="refresh" size={18} color="#f59e0b" />
                  </View>
                  <Text style={styles.recoveryText}>No stake required in Recovery Mode</Text>
                </LinearGradient>
              </View>
            )}

            {/* Title Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Prediction Title <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                titleFocused && styles.inputContainerFocused,
              ]}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What will you achieve?"
                  placeholderTextColor="#52525b"
                  style={styles.textInput}
                  maxLength={100}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Description <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                styles.textAreaContainer,
                descFocused && styles.inputContainerFocused,
              ]}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more details about your prediction..."
                  placeholderTextColor="#52525b"
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={500}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                />
              </View>
            </View>

            {/* Deadline Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Deadline <Text style={styles.required}>*</Text>
              </Text>

              {/* Quick Options */}
              <View style={styles.quickOptions}>
                {quickOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setDeadline(option.value)}
                    style={styles.quickOption}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                      style={styles.quickOptionGradient}
                    >
                      <Text style={styles.quickOptionIcon}>{option.icon}</Text>
                      <Text style={styles.quickOptionText}>{option.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date & Time Picker */}
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateTimeButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.dateTimeGradient}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#64748b" />
                    <Text style={styles.dateTimeText}>
                      {deadline.toLocaleDateString()}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateTimeButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.dateTimeGradient}
                  >
                    <Ionicons name="time-outline" size={20} color="#64748b" />
                    <Text style={styles.dateTimeText}>
                      {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Stake Section */}
            {!isInRecovery && (
              <View style={styles.inputSection}>
                <View style={styles.stakeLabelRow}>
                  <Text style={styles.inputLabel}>
                    Stake Credits <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.availableCredits}>
                    Available: {formatCredits(user?.credit_balance || 0)}
                  </Text>
                </View>

                {/* Stake Display Card */}
                <View style={styles.stakeCard}>
                  <LinearGradient
                    colors={['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.03)']}
                    style={styles.stakeCardGradient}
                  >
                    <View style={styles.stakeInputRow}>
                      <TextInput
                        value={stakeInput}
                        onChangeText={handleStakeInputChange}
                        onBlur={handleStakeInputBlur}
                        keyboardType="number-pad"
                        style={styles.stakeInput}
                      />
                      <Text style={styles.stakeUnit}>credits</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Slider */}
                <View style={styles.sliderContainer}>
                  <Slider
                    value={stake}
                    onValueChange={handleStakeChange}
                    minimumValue={STAKE.MIN}
                    maximumValue={maxStake || STAKE.MIN}
                    step={10}
                    minimumTrackTintColor="#a855f7"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                    thumbTintColor="#c084fc"
                    disabled={maxStake < STAKE.MIN}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>{STAKE.MIN}</Text>
                    <Text style={styles.sliderLabel}>{formatCredits(maxStake)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Risk Warning */}
            <View style={styles.warningCard}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.03)']}
                style={styles.warningGradient}
              >
                <View style={styles.warningIconContainer}>
                  <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                </View>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Risk Warning</Text>
                  <Text style={styles.warningText}>
                    {isInRecovery
                      ? 'If you fail this prediction, your original stake will be forfeited to the platform.'
                      : "If you fail this prediction, your stake will enter recovery mode. You'll need 2 consecutive successes to recover it, or the stake will be forfeited."}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Create Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isLoading || !canCreate}
              style={styles.createButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canCreate
                  ? ['#c084fc', '#a855f7', '#9333ea']
                  : ['#52525b', '#3f3f46', '#27272a']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createButtonText}>
                      {isInRecovery ? 'Create Recovery Prediction' : `Stake ${formatCredits(stake)} Credits`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    overflow: 'hidden',
  },
  auroraOrb: {
    position: 'absolute',
    borderRadius: 200,
  },
  auroraOrb1: {
    width: 350,
    height: 350,
    top: -150,
    left: -100,
  },
  auroraOrb2: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },

  // Recovery Banner
  recoveryBanner: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recoveryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
  },
  recoveryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recoveryText: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '500',
  },

  // Input Sections
  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 10,
    marginLeft: 4,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#52525b',
    fontWeight: '400',
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
  },
  inputContainerFocused: {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  textAreaContainer: {
    minHeight: 100,
  },
  textInput: {
    color: '#f8fafc',
    fontSize: 16,
    padding: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Quick Options
  quickOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickOption: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickOptionGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },
  quickOptionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickOptionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Date Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dateTimeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#f8fafc',
    marginLeft: 10,
    fontWeight: '500',
  },

  // Stake Section
  stakeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  availableCredits: {
    fontSize: 13,
    color: '#64748b',
  },
  stakeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  stakeCardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
  },
  stakeInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stakeInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#c084fc',
    minWidth: 100,
    textAlign: 'center',
    letterSpacing: -1,
  },
  stakeUnit: {
    fontSize: 18,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#52525b',
  },

  // Warning Card
  warningCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  warningGradient: {
    flexDirection: 'row',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 18,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },

  // Bottom Container
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(3, 7, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  createButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
