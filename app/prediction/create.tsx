import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/useUserStore';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { createPrediction } from '@/services/prediction.service';
import { useRegionStore } from '@/stores/useRegionStore';
import Toast from 'react-native-toast-message';

// 快捷时间选项
const QUICK_DEADLINES = [
  { label: '1周', days: 7 },
  { label: '1个月', days: 30 },
  { label: '3个月', days: 90 },
];

// 最小/最大押注
const MIN_STAKE = 10;
const MAX_STAKE = 1000;

export default function CreatePredictionScreen() {
  const { user } = useUserStore();
  const { fetchCurrentPrediction } = usePredictionStore();
  const { region } = useRegionStore();
  const isChina = region === 'CN';

  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 默认1个月
  const [stake, setStake] = useState(100);
  const [checkinPointCount, setCheckinPointCount] = useState(2); // 默认2个打卡点
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 计算天数
  const totalDays = useMemo(() => {
    const diffTime = deadline.getTime() - Date.now();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [deadline]);

  // 最大打卡点数 = 天数
  const maxCheckinPoints = totalDays;

  // 确保打卡点数不超过天数
  useMemo(() => {
    if (checkinPointCount > maxCheckinPoints) {
      setCheckinPointCount(Math.min(2, maxCheckinPoints));
    }
  }, [maxCheckinPoints]);

  // 计算奖励分配
  const checkinReward = Math.floor(stake / 2);
  const resultReward = stake - checkinReward;

  // 计算边际递减的打卡点奖励
  const checkinPointRewards = useMemo(() => {
    const n = checkinPointCount;
    const sum = (n * (n + 1)) / 2;
    const rewards: number[] = [];
    
    for (let i = 1; i <= n; i++) {
      rewards.push(Math.round(checkinReward * (n - i + 1) / sum));
    }
    
    return rewards;
  }, [checkinPointCount, checkinReward]);

  // 处理快捷时间选择
  const handleQuickDeadline = (days: number) => {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + days);
    setDeadline(newDeadline);
  };

  // 处理日期选择
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && selectedDate > new Date()) {
      setDeadline(selectedDate);
    }
  };

  // 创建预测
  const handleCreate = async () => {
    // 验证
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: isChina ? '请输入目标标题' : 'Please enter a title' });
      return;
    }

    if (title.trim().length < 5) {
      Toast.show({ type: 'error', text1: isChina ? '标题至少5个字' : 'Title must be at least 5 characters' });
      return;
    }

    if (stake > (user?.credits || 0)) {
      Toast.show({ type: 'error', text1: isChina ? '积分不足' : 'Insufficient credits' });
      return;
    }

    setIsLoading(true);

    try {
      await createPrediction({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline,
        total_stake: stake,
        checkin_point_count: checkinPointCount,
      });

      await fetchCurrentPrediction();
      Toast.show({ type: 'success', text1: isChina ? '预测创建成功！' : 'Prediction created!' });
      router.back();
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: isChina ? '创建失败' : 'Failed to create',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化截止时间
  const formatDeadline = () => {
    return deadline.toLocaleDateString(isChina ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#030712]" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#a855f7" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">
            {isChina ? '创建预测' : 'New Prediction'}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 标题输入 */}
          <View className="mb-6">
            <Text className="text-white text-base font-semibold mb-2">
              {isChina ? '你要完成什么目标？' : 'What will you achieve?'}
            </Text>
            <TextInput
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-base"
              placeholder={isChina ? '例如：3个月减重10斤' : 'e.g., Lose 10kg in 3 months'}
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          {/* 描述输入 */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">
              {isChina ? '详细描述（可选）' : 'Description (optional)'}
            </Text>
            <TextInput
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-base min-h-[80px]"
              placeholder={isChina ? '添加更多细节...' : 'Add more details...'}
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          {/* 截止时间 */}
          <View className="mb-6">
            <Text className="text-white text-base font-semibold mb-3">
              {isChina ? '截止日期' : 'Deadline'}
            </Text>
            
            {/* 快捷选项 */}
            <View className="flex-row mb-4">
              {QUICK_DEADLINES.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  onPress={() => handleQuickDeadline(option.days)}
                  className={`px-4 py-2 rounded-xl mr-3 ${
                    totalDays === option.days 
                      ? 'bg-violet-600' 
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <Text className={totalDays === option.days ? 'text-white font-medium' : 'text-zinc-400'}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 日期显示 */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className="text-white text-base">{formatDeadline()}</Text>
              <View className="flex-row items-center">
                <Text className="text-violet-400 text-sm mr-2">{totalDays} {isChina ? '天' : 'days'}</Text>
                <Ionicons name="calendar-outline" size={20} color="#a855f7" />
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                themeVariant="dark"
              />
            )}
          </View>

          {/* 押注金额 */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-base font-semibold">
                {isChina ? '押注积分' : 'Stake Credits'}
              </Text>
              <Text className="text-zinc-500 text-sm">
                {isChina ? '可用' : 'Available'}: {user?.credits || 0}
              </Text>
            </View>

            {/* 当前值 */}
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 items-center">
              <Text className="text-violet-400 text-4xl font-bold">{stake}</Text>
              <Text className="text-zinc-500 text-sm mt-1">{isChina ? '积分' : 'Credits'}</Text>
            </View>

            {/* 滑块 */}
            <Slider
              value={stake}
              onValueChange={(v) => setStake(Math.round(v / 10) * 10)}
              minimumValue={MIN_STAKE}
              maximumValue={Math.min(MAX_STAKE, user?.credits || MIN_STAKE)}
              step={10}
              minimumTrackTintColor="#a855f7"
              maximumTrackTintColor="#27272a"
              thumbTintColor="#a855f7"
              style={{ height: 40 }}
            />
            <View className="flex-row justify-between">
              <Text className="text-zinc-600 text-xs">{MIN_STAKE}</Text>
              <Text className="text-zinc-600 text-xs">{Math.min(MAX_STAKE, user?.credits || MIN_STAKE)}</Text>
            </View>
          </View>

          {/* 🎯 打卡点设置 - 核心新功能 */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-white text-base font-semibold">
                {isChina ? '打卡点数量' : 'Checkin Points'}
              </Text>
              <TouchableOpacity className="ml-2">
                <Ionicons name="information-circle-outline" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* 打卡点数量选择 */}
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={() => setCheckinPointCount(Math.max(1, checkinPointCount - 1))}
                  className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center"
                  disabled={checkinPointCount <= 1}
                >
                  <Ionicons name="remove" size={24} color={checkinPointCount <= 1 ? '#3f3f46' : '#fff'} />
                </TouchableOpacity>
                
                <View className="items-center">
                  <Text className="text-white text-3xl font-bold">{checkinPointCount}</Text>
                  <Text className="text-zinc-500 text-sm">{isChina ? '个打卡点' : 'checkpoints'}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setCheckinPointCount(Math.min(maxCheckinPoints, checkinPointCount + 1))}
                  className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center"
                  disabled={checkinPointCount >= maxCheckinPoints}
                >
                  <Ionicons name="add" size={24} color={checkinPointCount >= maxCheckinPoints ? '#3f3f46' : '#fff'} />
                </TouchableOpacity>
              </View>

              <Text className="text-zinc-500 text-xs text-center">
                {isChina 
                  ? `最多 ${maxCheckinPoints} 个打卡点（每天一个）` 
                  : `Max ${maxCheckinPoints} checkpoints (1 per day)`
                }
              </Text>
            </View>

            {/* 打卡点奖励预览 */}
            <View className="bg-gradient-to-r from-violet-900/20 to-cyan-900/20 border border-violet-500/20 rounded-2xl p-4">
              <Text className="text-violet-400 text-sm font-medium mb-3">
                {isChina ? '📍 打卡点奖励分配（边际递减）' : '📍 Checkpoint Rewards (Diminishing)'}
              </Text>
              
              <View className="flex-row flex-wrap">
                {checkinPointRewards.map((reward, index) => (
                  <View key={index} className="w-1/3 p-1">
                    <View className="bg-white/5 rounded-xl p-3 items-center">
                      <Text className="text-zinc-400 text-xs mb-1">
                        {isChina ? `第${index + 1}点` : `#${index + 1}`}
                      </Text>
                      <Text className="text-white font-semibold">{reward}</Text>
                    </View>
                  </View>
                ))}
              </View>
              
              <View className="mt-3 pt-3 border-t border-white/10">
                <Text className="text-zinc-500 text-xs">
                  {isChina 
                    ? '⚡ 越早的打卡点奖励越高，错过即损失！'
                    : '⚡ Earlier checkpoints have higher rewards. Miss = Lost!'}
                </Text>
              </View>
            </View>
          </View>

          {/* 奖励分配预览 */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <Text className="text-white text-sm font-medium mb-4">
              {isChina ? '💰 奖励分配' : '💰 Reward Distribution'}
            </Text>
            
            <View className="flex-row mb-4">
              {/* 打卡奖励 */}
              <View className="flex-1 mr-2">
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 items-center">
                  <Text className="text-emerald-400 text-xs mb-1">{isChina ? '打卡奖励' : 'Checkin'}</Text>
                  <Text className="text-emerald-400 text-xl font-bold">{checkinReward}</Text>
                  <Text className="text-emerald-400/60 text-xs">50%</Text>
                </View>
              </View>
              
              {/* 结果奖励 */}
              <View className="flex-1 ml-2">
                <View className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 items-center">
                  <Text className="text-cyan-400 text-xs mb-1">{isChina ? '结果奖励' : 'Result'}</Text>
                  <Text className="text-cyan-400 text-xl font-bold">{resultReward}</Text>
                  <Text className="text-cyan-400/60 text-xs">50%</Text>
                </View>
              </View>
            </View>

            <Text className="text-zinc-500 text-xs text-center">
              {isChina 
                ? '完成所有打卡点 + 裁判通过 = 获得全部奖励'
                : 'Complete all checkpoints + Pass referee = Full reward'}
            </Text>
          </View>

          {/* 风险提示 */}
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex-row">
            <Ionicons name="warning" size={20} color="#f59e0b" style={{ marginTop: 2 }} />
            <View className="flex-1 ml-3">
              <Text className="text-amber-500 text-sm">
                {isChina 
                  ? `错过打卡点将损失对应奖励，裁判投票失败将损失结果奖励 ${resultReward} 积分。`
                  : `Missing checkpoints = lost rewards. Failed referee vote = lost ${resultReward} credits.`}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View className="px-4 py-4 border-t border-white/10 bg-[#030712]">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isLoading || !title.trim() || stake > (user?.credits || 0)}
            className={`py-4 rounded-2xl items-center ${
              isLoading || !title.trim() || stake > (user?.credits || 0)
                ? 'bg-zinc-800'
                : 'bg-violet-600'
            }`}
          >
            {isLoading ? (
              <Text className="text-white font-semibold">{isChina ? '创建中...' : 'Creating...'}</Text>
            ) : (
              <Text className="text-white font-semibold text-base">
                {isChina ? `押注 ${stake} 积分并创建` : `Stake ${stake} & Create`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
