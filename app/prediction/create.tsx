import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useUserStore } from '@/stores/useUserStore';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { predictionService } from '@/services/prediction.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { formatCredit } from '@/lib/utils';
import { STAKE_LIMITS } from '@/lib/constants';

// 快捷时间选项
const QUICK_DEADLINES = [
  { label: '1 Day', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '1 Month', days: 30 },
];

export default function CreatePredictionScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user, recovery } = useUserStore();
  const { fetchCurrentPrediction } = usePredictionStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [stake, setStake] = useState(10);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customStake, setCustomStake] = useState('');

  const isRecoveryMode = user?.status === 'RECOVERY';
  const maxStake = Math.min(user?.credit_balance || 0, STAKE_LIMITS.MAX_STAKE);
  const minStake = STAKE_LIMITS.MIN_STAKE;

  // 处理快捷时间选择
  const handleQuickDeadline = (days: number) => {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + days);
    setDeadline(newDeadline);
  };

  // 处理日期选择
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  // 处理滑块变化
  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value / 10) * 10;
    setStake(roundedValue);
    setCustomStake('');
  };

  // 处理自定义金额输入
  const handleCustomStakeChange = (text: string) => {
    setCustomStake(text);
    const value = parseInt(text, 10);
    if (!isNaN(value) && value >= minStake && value <= maxStake) {
      setStake(value);
    }
  };

  // 创建预测
  const handleCreate = async () => {
    // 验证
    if (!title.trim()) {
      toast.error('Please enter a prediction title');
      return;
    }

    if (deadline <= new Date()) {
      toast.error('Deadline must be in the future');
      return;
    }

    if (!isRecoveryMode && stake < minStake) {
      toast.error(`Minimum stake is ${formatCredit(minStake)}`);
      return;
    }

    if (!isRecoveryMode && stake > maxStake) {
      toast.error(`Maximum stake is ${formatCredit(maxStake)}`);
      return;
    }

    setIsLoading(true);

    try {
      await predictionService.create(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          deadline: deadline.toISOString(),
          stake: isRecoveryMode ? 0 : stake,
        },
        isRecoveryMode ? recovery?.id : undefined
      );

      await fetchCurrentPrediction();
      toast.success('Prediction created!');
      router.back();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create prediction');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化截止时间显示
  const formatDeadline = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return deadline.toLocaleDateString('en-US', options);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1">
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-violet-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">
            {isRecoveryMode ? 'Recovery Prediction' : 'New Prediction'}
          </Text>
          <View className="w-16" />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recovery Mode Banner */}
          {isRecoveryMode && (
            <Card variant="outlined" className="mt-4 border-amber-500/50 bg-amber-500/10">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🔄</Text>
                <View className="flex-1">
                  <Text className="text-amber-500 font-semibold">Recovery Mode</Text>
                  <Text className="text-zinc-400 text-sm">
                    Complete this to progress ({recovery?.consecutive_successes || 0}/2)
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* 标题输入 */}
          <View className="mt-6">
            <Text className="text-white text-lg font-semibold mb-3">What will you achieve?</Text>
            <Input
              placeholder="e.g., Run 5km every morning"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* 描述输入 */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Description (optional)</Text>
            <TextInput
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-base min-h-[80px]"
              placeholder="Add more details..."
              placeholderTextColor="#71717a"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* 截止时间 */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Deadline</Text>
            
            {/* 快捷选项 */}
            <View className="flex-row mb-4">
              {QUICK_DEADLINES.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  onPress={() => handleQuickDeadline(option.days)}
                  className="bg-zinc-800 px-4 py-2 rounded-lg mr-2"
                >
                  <Text className="text-white text-sm">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 日期选择器触发 */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4"
            >
              <Text className="text-white text-base">{formatDeadline()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="datetime"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                themeVariant="dark"
              />
            )}
          </View>

          {/* 押注金额 - 仅非恢复模式显示 */}
          {!isRecoveryMode && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white text-lg font-semibold">Stake Credit</Text>
                <Text className="text-zinc-500 text-sm">
                  Available: {formatCredit(user?.credit_balance || 0)}
                </Text>
              </View>

              {/* 当前值显示 */}
              <Card variant="default" className="mb-4">
                <View className="items-center py-2">
                  <Text className="text-violet-500 text-4xl font-bold">
                    {formatCredit(stake)}
                  </Text>
                </View>
              </Card>

              {/* 滑块 */}
              <Slider
                value={stake}
                onValueChange={handleSliderChange}
                minimumValue={minStake}
                maximumValue={maxStake}
                step={10}
                minimumTrackTintColor="#8b5cf6"
                maximumTrackTintColor="#3f3f46"
                thumbTintColor="#8b5cf6"
                style={{ height: 40 }}
              />

              {/* 范围显示 */}
              <View className="flex-row justify-between mb-4">
                <Text className="text-zinc-500 text-xs">{formatCredit(minStake)}</Text>
                <Text className="text-zinc-500 text-xs">{formatCredit(maxStake)}</Text>
              </View>

              {/* 自定义输入 */}
              <View className="flex-row items-center">
                <Text className="text-zinc-400 text-sm mr-3">Custom:</Text>
                <TextInput
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-base w-24"
                  placeholder="Amount"
                  placeholderTextColor="#71717a"
                  value={customStake}
                  onChangeText={handleCustomStakeChange}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* 风险提示 */}
          <Card variant="outlined" className="mb-6 border-zinc-700">
            <View className="flex-row items-start">
              <Text className="text-xl mr-3">⚠️</Text>
              <View className="flex-1">
                <Text className="text-zinc-400 text-sm">
                  {isRecoveryMode 
                    ? 'If you fail this prediction, your original stake will be forfeited.'
                    : `If you fail, your ${formatCredit(stake)} stake will be frozen. You'll need 2 consecutive successes to recover it.`
                  }
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* 底部按钮 */}
        <View 
          className="px-4 py-4 border-t border-zinc-800 bg-black"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Button
            onPress={handleCreate}
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!title.trim() || (!isRecoveryMode && stake > (user?.credit_balance || 0))}
          >
            {isRecoveryMode ? 'Start Recovery Prediction' : `Stake ${formatCredit(stake)} & Create`}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

