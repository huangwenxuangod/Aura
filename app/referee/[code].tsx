import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import {
  getPredictionByRefereeCode,
  joinAsReferee,
  submitVote,
  calculateCheckinProgress,
} from '@/services/prediction.service';
import { useCountdown } from '@/hooks/useCountdown';
import { useRegionStore } from '@/stores/useRegionStore';
import type { PredictionDetail, CheckinPoint } from '@/types';

export default function RefereeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { region } = useRegionStore();
  const isChina = region === 'CN';

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voteComment, setVoteComment] = useState('');

  const countdown = useCountdown(prediction?.deadline || null);

  // 检查认证状态
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
      setIsAuthenticated(!!user);
    });
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!code) return;

    const data = await getPredictionByRefereeCode(code);
    setPrediction(data);
  }, [code]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // 计算状态
  const referees = prediction?.referees || [];
  const checkins = prediction?.checkins || [];
  const checkinPoints = prediction?.checkin_points || [];
  const progress = calculateCheckinProgress(checkinPoints);

  const isReferee = referees.some((r) => r.user_id === currentUserId);
  const currentReferee = referees.find((r) => r.user_id === currentUserId);
  const hasVoted = currentReferee?.vote !== null;
  const canVote = prediction?.status === 'judging' && isReferee && !hasVoted;
  const isCreator = prediction?.user_id === currentUserId;

  // 加入成为裁判
  const handleJoin = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        isChina ? '需要登录' : 'Sign In Required',
        isChina ? '请先登录才能成为裁判' : 'You need to sign in to become a referee.',
        [
          { text: isChina ? '取消' : 'Cancel', style: 'cancel' },
          {
            text: isChina ? '登录' : 'Sign In',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    if (isCreator) {
      Toast.show({
        type: 'error',
        text1: isChina ? '不能给自己的预测当裁判' : 'Cannot join your own prediction',
      });
      return;
    }

    setIsJoining(true);
    try {
      await joinAsReferee(prediction!.id);
      await loadData();
      Toast.show({
        type: 'success',
        text1: isChina ? '你现在是裁判了！' : 'You are now a referee!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isChina ? '加入失败' : 'Failed to join',
        text2: error.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  // 投票
  const handleVote = (vote: 'success' | 'failure') => {
    const voteText = vote === 'success' 
      ? (isChina ? '成功' : 'Success') 
      : (isChina ? '失败' : 'Failure');

    Alert.alert(
      isChina ? `投票: ${voteText}` : `Vote: ${voteText}`,
      isChina 
        ? `确定投票「${voteText}」吗？投票后不可更改。`
        : `Are you sure you want to vote "${voteText}"? This cannot be changed.`,
      [
        { text: isChina ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: isChina ? '确定' : 'Confirm',
          onPress: async () => {
            setIsVoting(true);
            try {
              await submitVote(prediction!.id, vote, voteComment || undefined);
              await loadData();
              Toast.show({
                type: 'success',
                text1: isChina ? '投票成功！' : 'Vote submitted!',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: isChina ? '投票失败' : 'Failed to vote',
                text2: error.message,
              });
            } finally {
              setIsVoting(false);
            }
          },
        },
      ]
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.15)', 'transparent']}
          style={styles.loadingGradient}
        />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>
            {isChina ? '加载中...' : 'Loading prediction...'}
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // Error State
  if (!prediction) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.1)', 'transparent']}
          style={styles.errorGradient}
        />
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>
            {isChina ? '裁判码无效' : 'Invalid Referee Code'}
          </Text>
          <Text style={styles.errorDesc}>
            {isChina ? '这个裁判码不存在或已过期' : 'This referee code doesn\'t exist or has expired.'}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>{isChina ? '返回' : 'Go Back'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // 状态配置
  const statusConfig: Record<string, any> = {
    active: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: isChina ? '进行中' : 'Active' },
    judging: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: isChina ? '等待投票' : 'Awaiting Your Vote' },
    settled: { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.15)', label: isChina ? '已结算' : 'Settled' },
  };
  const currentStatus = statusConfig[prediction.status] || statusConfig.active;

  // 投票统计
  const yesVotes = referees.filter((r) => r.vote === 'success').length;
  const noVotes = referees.filter((r) => r.vote === 'failure').length;
  const totalVotes = yesVotes + noVotes;

  const creator = (prediction as any).user;

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#c084fc"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#a855f7" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isChina ? '裁判视角' : 'Referee View'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Creator Card */}
          <View style={styles.creatorCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.08)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.creatorGradient}
            >
              <View style={styles.creatorInfo}>
                <View style={styles.creatorAvatar}>
                  <Text style={styles.creatorAvatarText}>
                    {creator?.display_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.creatorDetails}>
                  <Text style={styles.creatorName}>
                    {creator?.display_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.creatorLabel}>
                    {isChina ? '的预测' : 'is predicting'}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: currentStatus.bgColor }]}>
                <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
                <Text style={[styles.statusText, { color: currentStatus.color }]}>
                  {currentStatus.label}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Prediction Title */}
          <View style={styles.titleSection}>
            <Text style={styles.predictionTitle}>{prediction.title}</Text>
            {prediction.description && (
              <Text style={styles.predictionDesc}>{prediction.description}</Text>
            )}
          </View>

          {/* 📍 打卡点进度 - 核心展示 */}
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>
              {isChina ? '📍 打卡进度' : '📍 Checkin Progress'}
            </Text>
            
            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>{progress.completed}</Text>
                <Text style={styles.progressStatLabel}>{isChina ? '已完成' : 'Done'}</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatValue, { color: '#ef4444' }]}>{progress.missed}</Text>
                <Text style={styles.progressStatLabel}>{isChina ? '已错过' : 'Missed'}</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>{progress.pending}</Text>
                <Text style={styles.progressStatLabel}>{isChina ? '待完成' : 'Pending'}</Text>
              </View>
            </View>

            {/* 进度条 */}
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressBarFill, { width: `${(progress.completed / progress.total) * 100}%` }]} 
              />
              <View 
                style={[
                  styles.progressBarMissed, 
                  { 
                    width: `${(progress.missed / progress.total) * 100}%`,
                    left: `${(progress.completed / progress.total) * 100}%`
                  }
                ]} 
              />
            </View>

            {/* 奖励统计 */}
            <View style={styles.rewardRow}>
              <View style={styles.rewardItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.rewardText}>
                  {isChina ? `已获得 ${progress.earnedReward}` : `Earned ${progress.earnedReward}`}
                </Text>
              </View>
              {progress.lostReward > 0 && (
                <View style={styles.rewardItem}>
                  <Ionicons name="close-circle" size={16} color="#ef4444" />
                  <Text style={styles.rewardText}>
                    {isChina ? `已损失 ${progress.lostReward}` : `Lost ${progress.lostReward}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 💰 奖励分配 */}
          <View style={styles.rewardCard}>
            <Text style={styles.sectionTitle}>
              {isChina ? '💰 奖励分配' : '💰 Reward Split'}
            </Text>
            <View style={styles.rewardSplit}>
              <View style={styles.rewardSplitItem}>
                <Text style={styles.rewardSplitLabel}>{isChina ? '打卡奖励' : 'Checkin'}</Text>
                <Text style={styles.rewardSplitValue}>{prediction.checkin_reward}</Text>
              </View>
              <View style={styles.rewardSplitItem}>
                <Text style={styles.rewardSplitLabel}>{isChina ? '结果奖励' : 'Result'}</Text>
                <Text style={[styles.rewardSplitValue, { color: '#06b6d4' }]}>{prediction.result_reward}</Text>
              </View>
              <View style={styles.rewardSplitItem}>
                <Text style={styles.rewardSplitLabel}>{isChina ? '总押注' : 'Total'}</Text>
                <Text style={[styles.rewardSplitValue, { color: '#a855f7' }]}>{prediction.total_stake}</Text>
              </View>
            </View>
          </View>

          {/* 📝 打卡记录详情 - 裁判判断依据 */}
          <View style={styles.checkinsSection}>
            <Text style={styles.sectionTitle}>
              {isChina ? '📝 打卡记录 (裁判判断依据)' : '📝 Checkin Records (Judge Based On)'}
            </Text>

            {checkins.length === 0 ? (
              <View style={styles.emptyCheckins}>
                <Ionicons name="document-text-outline" size={40} color="#3f3f46" />
                <Text style={styles.emptyCheckinsText}>
                  {isChina ? '还没有打卡记录' : 'No checkins yet'}
                </Text>
              </View>
            ) : (
              checkins.map((checkin, index) => {
                const relatedPoint = checkinPoints.find(p => p.id === checkin.checkin_point_id);
                return (
                  <View key={checkin.id} style={styles.checkinCard}>
                    <View style={styles.checkinHeader}>
                      <View style={styles.checkinIndex}>
                        <Text style={styles.checkinIndexText}>#{checkins.length - index}</Text>
                      </View>
                      <View style={styles.checkinMeta}>
                        <Text style={styles.checkinDate}>
                          {new Date(checkin.created_at).toLocaleDateString(isChina ? 'zh-CN' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {relatedPoint && (
                          <View style={styles.checkinPointBadge}>
                            <Ionicons name="flag" size={12} color="#10b981" />
                            <Text style={styles.checkinPointText}>
                              {isChina ? `第${relatedPoint.point_index}点` : `#${relatedPoint.point_index}`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <Text style={styles.checkinContent}>{checkin.content}</Text>
                    
                    {checkin.image_url && (
                      <Image
                        source={{ uri: checkin.image_url }}
                        style={styles.checkinImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* 投票结果 */}
          {prediction.status === 'judging' && totalVotes > 0 && (
            <View style={styles.votingResultCard}>
              <Text style={styles.sectionTitle}>
                {isChina ? '📊 当前投票' : '📊 Current Votes'}
              </Text>
              <View style={styles.votingRow}>
                <View style={styles.voteItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.voteLabel}>{isChina ? '成功' : 'Success'}</Text>
                  <Text style={styles.voteCount}>{yesVotes}</Text>
                </View>
                <View style={styles.voteDivider} />
                <View style={styles.voteItem}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                  <Text style={styles.voteLabel}>{isChina ? '失败' : 'Failed'}</Text>
                  <Text style={styles.voteCount}>{noVotes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* 操作区域 */}
          <View style={styles.actionSection}>
            {/* 加入按钮 */}
            {!isReferee && !isCreator && prediction.status === 'active' && (
              <TouchableOpacity
                onPress={handleJoin}
                disabled={isJoining}
                style={styles.joinButton}
              >
                <LinearGradient
                  colors={['#c084fc', '#a855f7', '#9333ea']}
                  style={styles.joinButtonGradient}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="people" size={22} color="#fff" />
                      <Text style={styles.joinButtonText}>
                        {isChina ? '成为裁判' : 'Become a Referee'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* 投票区域 */}
            {canVote && (
              <View style={styles.votingSection}>
                <Text style={styles.votingPrompt}>
                  {isChina 
                    ? '根据打卡记录，你认为 TA 完成目标了吗？'
                    : 'Based on the checkins, did they achieve their goal?'}
                </Text>

                {/* 评论输入 */}
                <TextInput
                  style={styles.commentInput}
                  placeholder={isChina ? '添加评语（可选）' : 'Add a comment (optional)'}
                  placeholderTextColor="#64748b"
                  value={voteComment}
                  onChangeText={setVoteComment}
                  maxLength={200}
                />

                <View style={styles.voteButtonsRow}>
                  <TouchableOpacity
                    onPress={() => handleVote('success')}
                    disabled={isVoting}
                    style={[styles.voteButton, styles.voteButtonSuccess]}
                  >
                    <LinearGradient
                      colors={['#34d399', '#10b981', '#059669']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={32} color="#fff" />
                          <Text style={styles.voteButtonText}>
                            {isChina ? '成功' : 'Success'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleVote('failure')}
                    disabled={isVoting}
                    style={[styles.voteButton, styles.voteButtonFail]}
                  >
                    <LinearGradient
                      colors={['#f87171', '#ef4444', '#dc2626']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close" size={32} color="#fff" />
                          <Text style={styles.voteButtonText}>
                            {isChina ? '失败' : 'Failed'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 已投票状态 */}
            {hasVoted && prediction.status === 'judging' && (
              <View style={styles.statusCard}>
                <Ionicons
                  name={currentReferee?.vote === 'success' ? 'checkmark-circle' : 'close-circle'}
                  size={40}
                  color={currentReferee?.vote === 'success' ? '#10b981' : '#ef4444'}
                />
                <Text style={styles.statusCardTitle}>
                  {isChina 
                    ? `你投了: ${currentReferee?.vote === 'success' ? '成功' : '失败'}`
                    : `You voted: ${currentReferee?.vote === 'success' ? 'Success' : 'Failed'}`}
                </Text>
                {currentReferee?.comment && (
                  <Text style={styles.statusCardComment}>"{currentReferee.comment}"</Text>
                )}
                <Text style={styles.statusCardDesc}>
                  {isChina ? '等待其他裁判投票' : 'Waiting for other referees'}
                </Text>
              </View>
            )}

            {/* 已是裁判 */}
            {isReferee && !canVote && prediction.status === 'active' && (
              <View style={styles.statusCard}>
                <Ionicons name="time" size={40} color="#f59e0b" />
                <Text style={styles.statusCardTitle}>
                  {isChina ? '你已是裁判' : 'You\'re a Referee'}
                </Text>
                <Text style={styles.statusCardDesc}>
                  {isChina ? '预测结束后你将收到投票通知' : 'You\'ll be notified when judgment is requested'}
                </Text>
              </View>
            )}

            {/* 自己的预测 */}
            {isCreator && (
              <View style={styles.statusCard}>
                <Ionicons name="person" size={40} color="#a855f7" />
                <Text style={styles.statusCardTitle}>
                  {isChina ? '这是你的预测' : 'This is your prediction'}
                </Text>
                <Text style={styles.statusCardDesc}>
                  {isChina ? '你不能给自己的预测投票' : 'You cannot vote on your own prediction'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Loading & Error
  loadingGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  errorDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },

  // Creator Card
  creatorCard: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  creatorGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 20,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  creatorAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  creatorLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Title Section
  titleSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  predictionDesc: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 22,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressBarMissed: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardText: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // Reward Card
  rewardCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  rewardSplit: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardSplitItem: {
    alignItems: 'center',
  },
  rewardSplitLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  rewardSplitValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },

  // Checkins Section
  checkinsSection: {
    marginBottom: 16,
  },
  emptyCheckins: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyCheckinsText: {
    fontSize: 14,
    color: '#52525b',
    marginTop: 12,
  },
  checkinCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkinIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkinIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c084fc',
  },
  checkinMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkinDate: {
    fontSize: 12,
    color: '#64748b',
  },
  checkinPointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  checkinPointText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
  },
  checkinContent: {
    fontSize: 15,
    color: '#f8fafc',
    lineHeight: 22,
  },
  checkinImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },

  // Voting Result Card
  votingResultCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  votingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  voteItem: {
    alignItems: 'center',
  },
  voteLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  voteCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  voteDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Action Section
  actionSection: {
    marginTop: 8,
  },
  joinButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  // Voting Section
  votingSection: {
    alignItems: 'center',
  },
  votingPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 16,
  },
  commentInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  voteButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  voteButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  voteButtonSuccess: {},
  voteButtonFail: {},
  voteButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },

  // Status Card
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  statusCardComment: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  statusCardDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
