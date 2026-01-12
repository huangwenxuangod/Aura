import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { predictionService } from '@/services/prediction.service';
import { shareService } from '@/services/share.service';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { formatCredit, formatDate } from '@/lib/utils';
import type { PredictionWithRelations, CheckIn } from '@/types';
import { ShareCard } from '@/components/ShareCard';

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { fetchCurrentPrediction } = usePredictionStore();
  const viewShotRef = useRef<ViewShot>(null);

  const [prediction, setPrediction] = useState<PredictionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInText, setCheckInText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const { formatted, isExpired } = useCountdown(prediction?.deadline || null);

  const loadPrediction = useCallback(async () => {
    if (!id) return;
    try {
      const data = await predictionService.getById(id);
      setPrediction(data);
    } catch (error) {
      toast.error('Failed to load prediction');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrediction();
    setRefreshing(false);
  }, [loadPrediction]);

  // 复制裁判码
  const handleCopyCode = async () => {
    if (prediction?.referee_code) {
      await Clipboard.setStringAsync(prediction.referee_code);
      toast.success('Referee code copied!');
    }
  };

  // 分享裁判码
  const handleShare = async () => {
    if (!prediction?.referee_code) return;
    
    try {
      const message = shareService.generateRefereeLink(prediction.referee_code);
      await shareService.shareText(message);
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  // 分享图片
  const handleShareImage = async () => {
    setShowShareCard(true);
    // 等待渲染后截图
    setTimeout(async () => {
      try {
        await shareService.shareImage(viewShotRef);
        setShowShareCard(false);
      } catch (error) {
        toast.error('Failed to share image');
        setShowShareCard(false);
      }
    }, 500);
  };

  // 添加文字打卡
  const handleTextCheckIn = async () => {
    if (!checkInText.trim() || !prediction) return;
    
    setIsSubmitting(true);
    try {
      await predictionService.addCheckIn(prediction.id, 'TEXT', checkInText.trim());
      setCheckInText('');
      await loadPrediction();
      toast.success('Check-in added!');
    } catch (error) {
      toast.error('Failed to add check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加图片打卡
  const handleImageCheckIn = async () => {
    if (!prediction) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    setIsSubmitting(true);
    try {
      const imageUrl = await predictionService.uploadCheckInImage(
        prediction.id, 
        result.assets[0].uri
      );
      await predictionService.addCheckIn(prediction.id, 'IMAGE', undefined, imageUrl);
      await loadPrediction();
      toast.success('Photo added!');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 触发判定
  const handleTriggerJudging = () => {
    if (!prediction) return;

    const refereeCount = prediction.referees?.length || 0;
    
    Alert.alert(
      'Request Judgment',
      refereeCount === 0 
        ? 'You have no referees yet. Without referees, the prediction will auto-fail. Are you sure?'
        : `${refereeCount} referee(s) will vote on your prediction. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Judgment',
          onPress: async () => {
            try {
              await predictionService.triggerJudging(prediction.id);
              await loadPrediction();
              await fetchCurrentPrediction();
              toast.success('Judgment requested!');
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-zinc-500">Loading...</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-zinc-500">Prediction not found</Text>
      </View>
    );
  }

  const isActive = prediction.status === 'ACTIVE';
  const isJudging = prediction.status === 'JUDGING';
  const refereeCount = prediction.referees?.length || 0;
  const votedCount = prediction.referees?.filter(r => r.vote !== null).length || 0;

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-violet-500 text-base">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShareImage}>
          <Text className="text-violet-500 text-base">Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8b5cf6"
          />
        }
      >
        {/* 状态标签 */}
        <View className="flex-row items-center mt-4 mb-4">
          <View className={`px-3 py-1.5 rounded-full ${
            isJudging ? 'bg-amber-500/20' : 
            prediction.status === 'SUCCESS' ? 'bg-emerald-500/20' :
            prediction.status === 'FAILED' ? 'bg-red-500/20' :
            'bg-violet-500/20'
          }`}>
            <Text className={`text-sm font-semibold ${
              isJudging ? 'text-amber-500' : 
              prediction.status === 'SUCCESS' ? 'text-emerald-500' :
              prediction.status === 'FAILED' ? 'text-red-500' :
              'text-violet-500'
            }`}>
              {isJudging ? '⚖️ Judging' : 
               prediction.status === 'SUCCESS' ? '✓ Success' :
               prediction.status === 'FAILED' ? '✕ Failed' :
               '🔥 Active'}
            </Text>
          </View>
          <Text className="text-zinc-500 text-sm ml-auto">
            {formatCredit(prediction.stake)} staked
          </Text>
        </View>

        {/* 标题和描述 */}
        <Text className="text-white text-2xl font-bold mb-2">
          {prediction.title}
        </Text>
        {prediction.description && (
          <Text className="text-zinc-400 text-base mb-4">
            {prediction.description}
          </Text>
        )}

        {/* 倒计时卡片 */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-zinc-400 text-sm mb-2">
            {isExpired ? 'Expired' : isJudging ? 'Voting ends in' : 'Time remaining'}
          </Text>
          <Text className={`text-3xl font-mono font-bold ${isExpired ? 'text-red-500' : 'text-white'}`}>
            {formatted}
          </Text>
        </Card>

        {/* 裁判码卡片 - 仅活跃状态显示 */}
        {isActive && (
          <Card variant="default" className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Referee Code</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-2xl font-mono font-bold tracking-widest">
                {prediction.referee_code}
              </Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={handleCopyCode}
                  className="bg-zinc-800 px-3 py-2 rounded-lg mr-2"
                >
                  <Text className="text-white text-sm">Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleShare}
                  className="bg-violet-600 px-3 py-2 rounded-lg"
                >
                  <Text className="text-white text-sm">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-zinc-500 text-xs mt-2">
              Share this code with friends to supervise your prediction
            </Text>
          </Card>
        )}

        {/* 裁判状态 */}
        <Card variant="default" className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-lg font-semibold">Referees</Text>
            <Text className="text-zinc-500 text-sm">
              {refereeCount === 0 ? 'None yet' : `${votedCount}/${refereeCount} voted`}
            </Text>
          </View>
          
          {refereeCount === 0 ? (
            <Text className="text-zinc-500 text-sm">
              Share your referee code to get supervisors
            </Text>
          ) : (
            <View>
              {prediction.referees?.map((referee) => (
                <View 
                  key={referee.id}
                  className="flex-row items-center py-2 border-b border-zinc-800 last:border-b-0"
                >
                  <View className="w-8 h-8 rounded-full bg-zinc-700 items-center justify-center mr-3">
                    <Text className="text-white text-sm">👤</Text>
                  </View>
                  <Text className="text-white flex-1">Referee</Text>
                  <View className={`px-2 py-1 rounded ${
                    referee.vote === 'YES' ? 'bg-emerald-500/20' :
                    referee.vote === 'NO' ? 'bg-red-500/20' :
                    'bg-zinc-800'
                  }`}>
                    <Text className={`text-xs ${
                      referee.vote === 'YES' ? 'text-emerald-500' :
                      referee.vote === 'NO' ? 'text-red-500' :
                      'text-zinc-500'
                    }`}>
                      {referee.vote || 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* 打卡记录 */}
        <Card variant="default" className="mb-4">
          <Text className="text-white text-lg font-semibold mb-3">Check-ins</Text>
          
          {/* 打卡输入 - 仅活跃状态 */}
          {isActive && (
            <View className="mb-4">
              <View className="flex-row items-end">
                <TextInput
                  className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm mr-2"
                  placeholder="Add a check-in note..."
                  placeholderTextColor="#71717a"
                  value={checkInText}
                  onChangeText={setCheckInText}
                  multiline
                />
                <TouchableOpacity 
                  onPress={handleImageCheckIn}
                  className="bg-zinc-800 p-2 rounded-lg mr-2"
                  disabled={isSubmitting}
                >
                  <Text className="text-lg">📷</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleTextCheckIn}
                  className="bg-violet-600 px-4 py-2 rounded-lg"
                  disabled={isSubmitting || !checkInText.trim()}
                >
                  <Text className="text-white text-sm">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 打卡列表 */}
          {prediction.check_ins?.length === 0 ? (
            <Text className="text-zinc-500 text-sm text-center py-4">
              No check-ins yet
            </Text>
          ) : (
            prediction.check_ins?.map((checkIn) => (
              <View key={checkIn.id} className="py-3 border-b border-zinc-800 last:border-b-0">
                <Text className="text-zinc-500 text-xs mb-1">
                  {formatDate(checkIn.created_at)}
                </Text>
                {checkIn.type === 'TEXT' ? (
                  <Text className="text-white text-sm">{checkIn.content}</Text>
                ) : (
                  <Image
                    source={{ uri: checkIn.image_url }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                )}
              </View>
            ))
          )}
        </Card>

        {/* 触发判定按钮 - 仅活跃状态 */}
        {isActive && (
          <Button
            onPress={handleTriggerJudging}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Request Judgment
          </Button>
        )}
      </ScrollView>

      {/* 分享卡片 (隐藏) */}
      {showShareCard && prediction && (
        <View className="absolute -top-[1000px]">
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <ShareCard
              type={isActive ? 'prediction_created' : prediction.status === 'SUCCESS' ? 'prediction_success' : 'prediction_failed'}
              title={prediction.title}
              stake={prediction.stake}
              refereeCode={prediction.referee_code}
              deadline={prediction.deadline}
            />
          </ViewShot>
        </View>
      )}
    </View>
  );
}

