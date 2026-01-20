import { useState, useMemo, useEffect } from 'react';
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
import { usePredictionStore } from '@/stores/usePredictionStore';
import { createPrediction } from '@/services/prediction.service';
import { formatCredits, addDays } from '@/lib/utils';

// 常量
const STAKE = {
  MIN: 50,
  MAX: 10000,
  DEFAULT: 100,
};

const CHECKIN_POINTS = {
  MIN: 1,
  MAX: 30,
  DEFAULT: 7,
};

export default function CreatePredictionScreen() {
  const router = useRouter();
  const { user, fetchUser } = useUserStore();
  const { currentPrediction, fetchCurrentPrediction } = usePredictionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date>(() => addDays(new Date(), 7));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stake, setStake] = useState(STAKE.DEFAULT);
  const [stakeInput, setStakeInput] = useState(STAKE.DEFAULT.toString());
  const [checkinPointCount, setCheckinPointCount] = useState(CHECKIN_POINTS.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const hasActivePrediction = currentPrediction && 
    (currentPrediction.status === 'active' || currentPrediction.status === 'judging');
  const maxStake = Math.min(user?.credits || 0, STAKE.MAX);
  const canCreate = !hasActivePrediction && (user?.credits || 0) >= STAKE.MIN;

  // 初始化
  useEffect(() => {
    fetchCurrentPrediction();
  }, []);

  // 快速截止日期选项
  const quickOptions = useMemo(() => [
    { label: '7天', value: addDays(new Date(), 7), icon: '⚡' },
    { label: '14天', value: addDays(new Date(), 14), icon: '📅' },
    { label: '30天', value: addDays(new Date(), 30), icon: '🗓️' },
  ], []);

  // 计算边际递减奖励预览
  const rewardPreview = useMemo(() => {
    const checkinReward = Math.floor(stake / 2);
    const resultReward = stake - checkinReward;
    
    // 边际递减：第 n 个打卡点获得 (N - n + 1) 份基础奖励
    const totalUnits = (checkinPointCount * (checkinPointCount + 1)) / 2;
    const baseUnit = checkinReward / totalUnits;
    
    const rewards = [];
    for (let i = 1; i <= checkinPointCount; i++) {
      const units = checkinPointCount - i + 1;
      rewards.push(Math.round(baseUnit * units));
    }
    
    return { checkinReward, resultReward, rewards };
  }, [stake, checkinPointCount]);

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
    if (selectedDate && selectedDate > new Date()) {
      setDeadline(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: '请输入预测标题' });
      return;
    }

    if (deadline <= new Date()) {
      Toast.show({ type: 'error', text1: '截止日期必须在未来' });
      return;
    }

    if (stake > (user?.credits || 0)) {
      Toast.show({ type: 'error', text1: '积分不足' });
      return;
    }

    setIsLoading(true);
    try {
      const prediction = await createPrediction({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline,
        total_stake: stake,
        checkin_point_count: checkinPointCount,
      });

      await Promise.all([fetchCurrentPrediction(), fetchUser()]);

      Toast.show({
        type: 'success',
        text1: '预测创建成功！',
        text2: `已押注 ${stake} 积分，${checkinPointCount} 个打卡点`,
      });

      router.replace('/(tabs)/index');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: '创建失败',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 如果已有进行中的预测，显示提示
  if (hasActivePrediction) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.1)', 'transparent']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.existingContainer}>
            <View style={styles.existingIconContainer}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                style={styles.existingIconGradient}
              >
                <Ionicons name="flag" size={44} color="#f59e0b" />
              </LinearGradient>
            </View>
            <Text style={styles.existingTitle}>已有进行中的预测</Text>
            <Text style={styles.existingDesc}>
              同一时间只能有一个进行中的预测。请先完成或取消当前预测。
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/(screens)/prediction/${currentPrediction!.id}`)}
              style={styles.existingButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#c084fc', '#a855f7', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.existingButtonGradient}
              >
                <Text style={styles.existingButtonText}>查看当前预测</Text>
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
              <Text style={styles.headerTitle}>创建预测</Text>
              <Text style={styles.headerSubtitle}>
                设定目标，押注承诺，让朋友监督你完成
              </Text>
            </View>

            {/* Title Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                预测标题 <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                titleFocused && styles.inputContainerFocused,
              ]}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="例如：每天运动30分钟"
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
                描述 <Text style={styles.optional}>(可选)</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                styles.textAreaContainer,
                descFocused && styles.inputContainerFocused,
              ]}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="添加更多细节..."
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
                截止日期 <Text style={styles.required}>*</Text>
              </Text>

              {/* Quick Options */}
              <View style={styles.quickOptions}>
                {quickOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setDeadline(option.value)}
                    style={[
                      styles.quickOption,
                      deadline.toDateString() === option.value.toDateString() && styles.quickOptionActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickOptionIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.quickOptionText,
                      deadline.toDateString() === option.value.toDateString() && styles.quickOptionTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Picker */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                <Text style={styles.dateText}>
                  {deadline.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Checkin Points Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                打卡点数量 <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputHint}>
                越早的打卡点奖励越高，错过损失也越大
              </Text>

              <View style={styles.pointsCard}>
                <View style={styles.pointsDisplay}>
                  <Text style={styles.pointsValue}>{checkinPointCount}</Text>
                  <Text style={styles.pointsUnit}>个打卡点</Text>
                </View>
                <Slider
                  value={checkinPointCount}
                  onValueChange={(v) => setCheckinPointCount(Math.round(v))}
                  minimumValue={CHECKIN_POINTS.MIN}
                  maximumValue={CHECKIN_POINTS.MAX}
                  step={1}
                  minimumTrackTintColor="#06b6d4"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.1)"
                  thumbTintColor="#22d3ee"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>{CHECKIN_POINTS.MIN}</Text>
                  <Text style={styles.sliderLabel}>{CHECKIN_POINTS.MAX}</Text>
                </View>
              </View>

              {/* Reward Preview */}
              <View style={styles.rewardPreview}>
                <Text style={styles.rewardPreviewTitle}>奖励预览（边际递减）</Text>
                <View style={styles.rewardBars}>
                  {rewardPreview.rewards.slice(0, 5).map((reward, index) => (
                    <View key={index} style={styles.rewardBarItem}>
                      <View 
                        style={[
                          styles.rewardBar, 
                          { height: Math.max(20, (reward / rewardPreview.rewards[0]) * 60) }
                        ]} 
                      />
                      <Text style={styles.rewardBarLabel}>#{index + 1}</Text>
                      <Text style={styles.rewardBarValue}>{reward}</Text>
                    </View>
                  ))}
                  {checkinPointCount > 5 && (
                    <View style={styles.rewardBarItem}>
                      <Text style={styles.rewardMoreText}>...</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Stake Section */}
            <View style={styles.inputSection}>
              <View style={styles.stakeLabelRow}>
                <Text style={styles.inputLabel}>
                  押注积分 <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.availableCredits}>
                  可用: {formatCredits(user?.credits || 0)}
                </Text>
              </View>

              <View style={styles.stakeCard}>
                <View style={styles.stakeInputRow}>
                  <TextInput
                    value={stakeInput}
                    onChangeText={handleStakeInputChange}
                    onBlur={handleStakeInputBlur}
                    keyboardType="number-pad"
                    style={styles.stakeInput}
                  />
                  <Text style={styles.stakeUnit}>积分</Text>
                </View>
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

              {/* Stake Distribution */}
              <View style={styles.stakeDistribution}>
                <View style={styles.stakeDistItem}>
                  <View style={[styles.stakeDistDot, { backgroundColor: '#06b6d4' }]} />
                  <Text style={styles.stakeDistLabel}>打卡奖励 (50%)</Text>
                  <Text style={styles.stakeDistValue}>{rewardPreview.checkinReward}</Text>
                </View>
                <View style={styles.stakeDistItem}>
                  <View style={[styles.stakeDistDot, { backgroundColor: '#a855f7' }]} />
                  <Text style={styles.stakeDistLabel}>结果奖励 (50%)</Text>
                  <Text style={styles.stakeDistValue}>{rewardPreview.resultReward}</Text>
                </View>
              </View>
            </View>

            {/* Warning */}
            <View style={styles.warningCard}>
              <Ionicons name="alert-circle" size={20} color="#f59e0b" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>风险提示</Text>
                <Text style={styles.warningText}>
                  错过打卡点将损失对应奖励；最终评审失败将损失结果奖励部分。
                </Text>
              </View>
            </View>

            {/* Create Button */}
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
                      押注 {formatCredits(stake)} 积分
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
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
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 10,
  },
  inputHint: {
    fontSize: 13,
    color: '#52525b',
    marginBottom: 12,
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
    borderRadius: 14,
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
  quickOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },
  quickOptionActive: {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
  quickOptionTextActive: {
    color: '#c084fc',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
  },
  dateText: {
    fontSize: 15,
    color: '#f8fafc',
    marginLeft: 10,
    fontWeight: '500',
  },
  pointsCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#22d3ee',
  },
  pointsUnit: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
  },
  rewardPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  rewardPreviewTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  rewardBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
  },
  rewardBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  rewardBar: {
    width: 24,
    backgroundColor: '#06b6d4',
    borderRadius: 4,
    marginBottom: 4,
  },
  rewardBarLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  rewardBarValue: {
    fontSize: 10,
    color: '#22d3ee',
    fontWeight: '600',
  },
  rewardMoreText: {
    color: '#64748b',
    fontSize: 16,
  },
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
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stakeInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stakeInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#c084fc',
    minWidth: 100,
    textAlign: 'center',
  },
  stakeUnit: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
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
  stakeDistribution: {
    flexDirection: 'row',
    gap: 12,
  },
  stakeDistItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
  },
  stakeDistDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stakeDistLabel: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
  },
  stakeDistValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  warningCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  createButton: {
    marginHorizontal: 20,
    borderRadius: 16,
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
  existingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  existingIconContainer: {
    marginBottom: 24,
  },
  existingIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  existingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  existingDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  existingButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  existingButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  existingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
