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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { 
  getPredictionDetail, 
  createCheckin, 
  uploadCheckinImage,
  triggerJudging,
  calculateCheckinProgress,
} from '@/services/prediction.service';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { useRegionStore } from '@/stores/useRegionStore';
import { useCountdown } from '@/hooks/useCountdown';
import type { PredictionDetail, CheckinPoint } from '@/types';

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchCurrentPrediction } = usePredictionStore();
  const { region } = useRegionStore();
  const isChina = region === 'CN';

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkinContent, setCheckinContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<CheckinPoint | null>(null);

  const { formatted, isExpired } = useCountdown(prediction?.deadline || null);

  const loadPrediction = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getPredictionDetail(id);
      setPrediction(data);
      
      // 自动选中今天可用的打卡点
      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const todayPoint = data.checkin_points?.find(
          p => p.due_date === today && p.status === 'pending'
        );
        setSelectedPoint(todayPoint || null);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: isChina ? '加载失败' : 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, [id, isChina]);

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
      Toast.show({ type: 'success', text1: isChina ? '已复制' : 'Copied!' });
    }
  };

  // 提交打卡
  const handleSubmitCheckin = async () => {
    if (!prediction || checkinContent.length < 10) {
      Toast.show({ 
        type: 'error', 
        text1: isChina ? '打卡内容至少10个字' : 'Checkin must be at least 10 characters' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createCheckin({
        prediction_id: prediction.id,
        content: checkinContent,
        checkin_point_id: selectedPoint?.id,
      });
      
      setCheckinContent('');
      await loadPrediction();
      await fetchCurrentPrediction();
      
      Toast.show({ 
        type: 'success', 
        text1: isChina ? '打卡成功！' : 'Checkin submitted!',
        text2: selectedPoint 
          ? (isChina ? `获得 ${selectedPoint.reward_amount} 积分` : `Earned ${selectedPoint.reward_amount} credits`)
          : undefined
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: isChina ? '打卡失败' : 'Failed to checkin' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 图片打卡
  const handleImageCheckin = async () => {
    if (!prediction) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    setIsSubmitting(true);
    try {
      const imageUrl = await uploadCheckinImage(prediction.id, result.assets[0].uri);
      await createCheckin({
        prediction_id: prediction.id,
        content: checkinContent || (isChina ? '图片打卡' : 'Photo checkin'),
        image_url: imageUrl,
        checkin_point_id: selectedPoint?.id,
      });
      
      setCheckinContent('');
      await loadPrediction();
      await fetchCurrentPrediction();
      
      Toast.show({ type: 'success', text1: isChina ? '图片上传成功' : 'Photo uploaded!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: isChina ? '上传失败' : 'Upload failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 触发评审
  const handleTriggerJudging = () => {
    if (!prediction) return;

    const refereeCount = prediction.referees?.length || 0;
    
    Alert.alert(
      isChina ? '请求评审' : 'Request Judgment',
      refereeCount === 0 
        ? (isChina ? '你还没有裁判。没有裁判将自动失败，确定吗？' : 'No referees yet. Without referees, prediction will auto-fail. Continue?')
        : (isChina ? `${refereeCount} 位裁判将为你的预测投票，继续吗？` : `${refereeCount} referee(s) will vote. Continue?`),
      [
        { text: isChina ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: isChina ? '确定' : 'Confirm',
          onPress: async () => {
            try {
              await triggerJudging(prediction.id);
              await loadPrediction();
              await fetchCurrentPrediction();
              Toast.show({ type: 'success', text1: isChina ? '已请求评审' : 'Judgment requested!' });
            } catch (error) {
              Toast.show({ type: 'error', text1: isChina ? '操作失败' : 'Failed' });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{isChina ? '加载中...' : 'Loading...'}</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{isChina ? '未找到预测' : 'Prediction not found'}</Text>
      </View>
    );
  }

  const isActive = prediction.status === 'active';
  const isJudging = prediction.status === 'judging';
  const progress = calculateCheckinProgress(prediction.checkin_points || []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#a855f7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isChina ? '预测详情' : 'Prediction'}
        </Text>
        <TouchableOpacity onPress={handleCopyCode} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#a855f7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
          />
        }
      >
        {/* 状态标签 */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            isJudging ? styles.statusBadgeJudging :
            prediction.status === 'settled' ? styles.statusBadgeSettled :
            styles.statusBadgeActive
          ]}>
            <Text style={[
              styles.statusText,
              isJudging ? styles.statusTextJudging :
              prediction.status === 'settled' ? styles.statusTextSettled :
              styles.statusTextActive
            ]}>
              {isJudging ? (isChina ? '⚖️ 评审中' : '⚖️ Judging') :
               prediction.status === 'settled' ? (isChina ? '✓ 已结算' : '✓ Settled') :
               (isChina ? '🔥 进行中' : '🔥 Active')}
            </Text>
          </View>
          <Text style={styles.stakeText}>
            {prediction.total_stake} {isChina ? '积分' : 'credits'}
          </Text>
        </View>

        {/* 标题 */}
        <Text style={styles.title}>{prediction.title}</Text>
        {prediction.description && (
          <Text style={styles.description}>{prediction.description}</Text>
        )}

        {/* 倒计时 */}
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.03)']}
          style={styles.countdownCard}
        >
          <Text style={styles.countdownLabel}>
            {isExpired ? (isChina ? '已到期' : 'Expired') : 
             isJudging ? (isChina ? '投票截止' : 'Voting ends in') : 
             (isChina ? '剩余时间' : 'Time remaining')}
          </Text>
          <Text style={[styles.countdownValue, isExpired && styles.countdownExpired]}>
            {formatted}
          </Text>
        </LinearGradient>

        {/* 🎯 打卡点进度 */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>
              {isChina ? '📍 打卡点进度' : '📍 Checkpoint Progress'}
            </Text>
            <Text style={styles.progressCount}>
              {progress.completed}/{progress.total}
            </Text>
          </View>

          {/* 打卡点列表 */}
          <View style={styles.checkpointList}>
            {(prediction.checkin_points || [])
              .sort((a, b) => a.point_index - b.point_index)
              .map((point, index) => (
                <TouchableOpacity
                  key={point.id}
                  onPress={() => point.status === 'pending' && setSelectedPoint(point)}
                  disabled={point.status !== 'pending'}
                  style={[
                    styles.checkpoint,
                    point.status === 'completed' && styles.checkpointCompleted,
                    point.status === 'missed' && styles.checkpointMissed,
                    selectedPoint?.id === point.id && styles.checkpointSelected,
                  ]}
                >
                  <View style={styles.checkpointIcon}>
                    {point.status === 'completed' ? (
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    ) : point.status === 'missed' ? (
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    ) : (
                      <View style={[
                        styles.checkpointDot,
                        selectedPoint?.id === point.id && styles.checkpointDotSelected
                      ]} />
                    )}
                  </View>
                  <View style={styles.checkpointContent}>
                    <Text style={styles.checkpointTitle}>
                      {isChina ? `第 ${index + 1} 点` : `#${index + 1}`}
                    </Text>
                    <Text style={styles.checkpointDate}>
                      {new Date(point.due_date).toLocaleDateString(isChina ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkpointReward,
                    point.status === 'completed' && styles.checkpointRewardCompleted,
                    point.status === 'missed' && styles.checkpointRewardMissed,
                  ]}>
                    <Text style={[
                      styles.checkpointRewardText,
                      point.status === 'completed' && styles.checkpointRewardTextCompleted,
                      point.status === 'missed' && styles.checkpointRewardTextMissed,
                    ]}>
                      {point.status === 'completed' ? '+' : point.status === 'missed' ? '-' : ''}{point.reward_amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* 奖励统计 */}
          <View style={styles.rewardStats}>
            <View style={styles.rewardStatItem}>
              <Text style={styles.rewardStatLabel}>{isChina ? '已获得' : 'Earned'}</Text>
              <Text style={styles.rewardStatValueGreen}>+{progress.earnedReward}</Text>
            </View>
            {progress.lostReward > 0 && (
              <View style={styles.rewardStatItem}>
                <Text style={styles.rewardStatLabel}>{isChina ? '已损失' : 'Lost'}</Text>
                <Text style={styles.rewardStatValueRed}>-{progress.lostReward}</Text>
              </View>
            )}
            <View style={styles.rewardStatItem}>
              <Text style={styles.rewardStatLabel}>{isChina ? '待获得' : 'Pending'}</Text>
              <Text style={styles.rewardStatValue}>
                {prediction.checkin_reward - progress.earnedReward - progress.lostReward}
              </Text>
            </View>
          </View>
        </View>

        {/* 打卡输入区域 */}
        {isActive && (
          <View style={styles.checkinCard}>
            <Text style={styles.sectionTitle}>
              {isChina ? '✍️ 打卡' : '✍️ Check In'}
            </Text>
            
            {selectedPoint && (
              <View style={styles.selectedPointBanner}>
                <Ionicons name="flag" size={16} color="#10b981" />
                <Text style={styles.selectedPointText}>
                  {isChina 
                    ? `完成此打卡可获得 ${selectedPoint.reward_amount} 积分`
                    : `Complete to earn ${selectedPoint.reward_amount} credits`}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.checkinInput}
              placeholder={isChina ? '今天做了什么？至少10个字...' : 'What did you do today? At least 10 characters...'}
              placeholderTextColor="#64748b"
              value={checkinContent}
              onChangeText={setCheckinContent}
              multiline
              maxLength={500}
            />

            <View style={styles.checkinActions}>
              <TouchableOpacity
                onPress={handleImageCheckin}
                style={styles.imageButton}
                disabled={isSubmitting}
              >
                <Ionicons name="image-outline" size={24} color="#a855f7" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitCheckin}
                disabled={isSubmitting || checkinContent.length < 10}
                style={[
                  styles.submitButton,
                  (isSubmitting || checkinContent.length < 10) && styles.submitButtonDisabled
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting 
                    ? (isChina ? '提交中...' : 'Submitting...') 
                    : (isChina ? '提交打卡' : 'Submit')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.charCount}>
              {checkinContent.length}/500 {checkinContent.length < 10 && (isChina ? '(至少10字)' : '(min 10)')}
            </Text>
          </View>
        )}

        {/* 裁判码 */}
        {isActive && (
          <View style={styles.refereeCodeCard}>
            <Text style={styles.sectionTitle}>
              {isChina ? '👥 裁判码' : '👥 Referee Code'}
            </Text>
            <View style={styles.refereeCodeRow}>
              <Text style={styles.refereeCode}>{prediction.referee_code}</Text>
              <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                <Ionicons name="copy-outline" size={20} color="#fff" />
                <Text style={styles.copyButtonText}>{isChina ? '复制' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.refereeCodeHint}>
              {isChina ? '分享给朋友，让他们监督你的进度' : 'Share with friends to supervise your progress'}
            </Text>
          </View>
        )}

        {/* 打卡记录 */}
        <View style={styles.checkinsCard}>
          <Text style={styles.sectionTitle}>
            {isChina ? '📝 打卡记录' : '📝 Checkin History'}
          </Text>
          
          {(prediction.checkins || []).length === 0 ? (
            <Text style={styles.emptyText}>
              {isChina ? '还没有打卡记录' : 'No checkins yet'}
            </Text>
          ) : (
            (prediction.checkins || []).map((checkin) => (
              <View key={checkin.id} style={styles.checkinItem}>
                <Text style={styles.checkinDate}>
                  {new Date(checkin.created_at).toLocaleDateString(isChina ? 'zh-CN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.checkinContent}>{checkin.content}</Text>
                {checkin.image_url && (
                  <Image
                    source={{ uri: checkin.image_url }}
                    style={styles.checkinImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))
          )}
        </View>

        {/* 触发评审按钮 */}
        {isActive && (
          <TouchableOpacity
            onPress={handleTriggerJudging}
            style={styles.judgeButton}
          >
            <Text style={styles.judgeButtonText}>
              {isChina ? '请求评审' : 'Request Judgment'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    padding: 4,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  statusBadgeJudging: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusBadgeSettled: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#a855f7',
  },
  statusTextJudging: {
    color: '#f59e0b',
  },
  statusTextSettled: {
    color: '#10b981',
  },
  stakeText: {
    color: '#64748b',
    fontSize: 14,
  },

  // Title
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },

  // Countdown
  countdownCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    marginBottom: 16,
  },
  countdownLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  countdownValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  countdownExpired: {
    color: '#ef4444',
  },

  // Progress Card
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },

  // Checkpoint List
  checkpointList: {
    gap: 8,
  },
  checkpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  checkpointCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkpointMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  checkpointSelected: {
    borderColor: '#a855f7',
    borderWidth: 2,
  },
  checkpointIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  checkpointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3f3f46',
    borderWidth: 2,
    borderColor: '#52525b',
  },
  checkpointDotSelected: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  checkpointContent: {
    flex: 1,
  },
  checkpointTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  checkpointDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  checkpointReward: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkpointRewardCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  checkpointRewardMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  checkpointRewardText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  checkpointRewardTextCompleted: {
    color: '#10b981',
  },
  checkpointRewardTextMissed: {
    color: '#ef4444',
  },

  // Reward Stats
  rewardStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 16,
  },
  rewardStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardStatLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  rewardStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  rewardStatValueGreen: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  rewardStatValueRed: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
  },

  // Checkin Card
  checkinCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  selectedPointBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  selectedPointText: {
    color: '#10b981',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  checkinInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkinActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  imageButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#3f3f46',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  charCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },

  // Referee Code Card
  refereeCodeCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  refereeCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  refereeCode: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  refereeCodeHint: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
  },

  // Checkins History
  checkinsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  checkinItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  checkinDate: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 6,
  },
  checkinContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  checkinImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },

  // Judge Button
  judgeButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  judgeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
