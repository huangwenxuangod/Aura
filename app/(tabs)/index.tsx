import { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/stores/useUserStore';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useRegionStore } from '@/stores/useRegionStore';

export default function HomeScreen() {
  const router = useRouter();
  const { user, fetchUser } = useUserStore();
  const { currentPrediction, checkinProgress, todayCheckinPoint, fetchCurrentPrediction } = usePredictionStore();
  const { region } = useRegionStore();
  const isChina = region === 'CN';

  // 刷新状态
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUser(), fetchCurrentPrediction()]);
    setIsRefreshing(false);
  }, []);

  const countdown = useCountdown(currentPrediction?.deadline || null);

  // 初始化
  useEffect(() => {
    fetchUser();
    fetchCurrentPrediction();
  }, []);

  const handleCreatePrediction = () => {
    router.push('/prediction/create');
  };

  const handleViewPrediction = () => {
    if (currentPrediction) {
      router.push(`/prediction/${currentPrediction.id}`);
    }
  };

  const canCreatePrediction = !currentPrediction || currentPrediction.status === 'settled';

  return (
    <View style={styles.container}>
      {/* Aurora Background */}
      <View style={styles.auroraContainer}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.15)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.12)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb2]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.1)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb3]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
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
            <View>
              <Text style={styles.greeting}>
                {isChina ? '欢迎回来' : 'Welcome back'}
              </Text>
              <Text style={styles.username}>
                {user?.display_name || (isChina ? '用户' : 'User')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatarButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.1)']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={24} color="#c084fc" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.1)', 'rgba(6, 182, 212, 0.06)', 'rgba(236, 72, 153, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              {/* Decorative Orbs */}
              <View style={styles.balanceOrbContainer}>
                <View style={[styles.decorOrb, styles.decorOrbPurple]} />
                <View style={[styles.decorOrb, styles.decorOrbCyan]} />
              </View>

              <View style={styles.balanceContent}>
                <Text style={styles.balanceLabel}>
                  {isChina ? '可用积分' : 'Available Credits'}
                </Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceValue}>
                    {user?.credits || 0}
                  </Text>
                  <Text style={styles.balanceUnit}>
                    {isChina ? '积分' : 'credits'}
                  </Text>
                </View>

                <View style={styles.balanceActions}>
                  <TouchableOpacity
                    onPress={() => router.push('/(screens)/recharge')}
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#c084fc', '#a855f7', '#9333ea']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButtonGradient}
                    >
                      <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>
                        {isChina ? '充值' : 'Recharge'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(screens)/history')}
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={18} color="#f8fafc" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryButtonText}>
                      {isChina ? '记录' : 'History'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* 今日打卡提醒 */}
          {todayCheckinPoint && (
            <View style={styles.todayCheckinBanner}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.todayCheckinGradient}
              >
                <View style={styles.todayCheckinIconContainer}>
                  <Ionicons name="today" size={22} color="#10b981" />
                </View>
                <View style={styles.todayCheckinContent}>
                  <Text style={styles.todayCheckinTitle}>
                    {isChina ? '今日打卡' : "Today's Checkin"}
                  </Text>
                  <Text style={styles.todayCheckinSubtitle}>
                    {isChina 
                      ? `完成可获得 ${todayCheckinPoint.reward_amount} 积分奖励`
                      : `Complete to earn ${todayCheckinPoint.reward_amount} credits`
                    }
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleViewPrediction}
                  style={styles.todayCheckinButton}
                >
                  <Text style={styles.todayCheckinButtonText}>
                    {isChina ? '去打卡' : 'Check'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Current Prediction */}
          {currentPrediction && currentPrediction.status !== 'settled' ? (
            <TouchableOpacity
              onPress={handleViewPrediction}
              style={styles.predictionCard}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                style={styles.predictionGradient}
              >
                {/* Status Header */}
                <View style={styles.predictionHeader}>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot,
                      currentPrediction.status === 'active' ? styles.statusDotActive : styles.statusDotJudging
                    ]} />
                    <Text style={styles.statusText}>
                      {currentPrediction.status === 'active' 
                        ? (isChina ? '进行中' : 'Active Prediction')
                        : (isChina ? '评审中' : 'Awaiting Judgment')
                      }
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>

                {/* Prediction Content */}
                <Text style={styles.predictionTitle} numberOfLines={2}>
                  {currentPrediction.title}
                </Text>

                {/* 打卡进度条 */}
                {checkinProgress && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>
                        {isChina ? '打卡进度' : 'Checkin Progress'}
                      </Text>
                      <Text style={styles.progressValue}>
                        {checkinProgress.completed}/{checkinProgress.total}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${(checkinProgress.completed / checkinProgress.total) * 100}%` }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.progressMissed, 
                          { 
                            width: `${(checkinProgress.missed / checkinProgress.total) * 100}%`,
                            left: `${(checkinProgress.completed / checkinProgress.total) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.progressStats}>
                      <View style={styles.progressStatItem}>
                        <View style={[styles.progressStatDot, { backgroundColor: '#10b981' }]} />
                        <Text style={styles.progressStatText}>
                          {isChina ? `已获得 ${checkinProgress.earnedReward}` : `Earned ${checkinProgress.earnedReward}`}
                        </Text>
                      </View>
                      {checkinProgress.missed > 0 && (
                        <View style={styles.progressStatItem}>
                          <View style={[styles.progressStatDot, { backgroundColor: '#ef4444' }]} />
                          <Text style={styles.progressStatText}>
                            {isChina ? `已损失 ${checkinProgress.lostReward}` : `Lost ${checkinProgress.lostReward}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Stats Row */}
                <View style={styles.predictionStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="time-outline" size={16} color="#64748b" />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>
                        {isChina ? '剩余' : 'Time Left'}
                      </Text>
                      <Text style={[
                        styles.statValue,
                        countdown.isExpired && styles.statValueExpired
                      ]}>
                        {countdown.formatted}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, styles.statIconPurple]}>
                      <Ionicons name="diamond-outline" size={16} color="#c084fc" />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>
                        {isChina ? '押注' : 'Stake'}
                      </Text>
                      <Text style={styles.statValuePurple}>
                        {currentPrediction.total_stake}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            /* Empty State */
            <View style={styles.emptyCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                style={styles.emptyGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.1)']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="flag" size={36} color="#c084fc" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>
                  {isChina ? '没有进行中的预测' : 'No Active Prediction'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {isChina
                    ? '创建一个预测，用打卡点追踪你的进度'
                    : 'Create a prediction and track your progress with checkpoints'}
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePrediction}
                  disabled={!canCreatePrediction}
                  style={styles.createButton}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={canCreatePrediction
                      ? ['#c084fc', '#a855f7', '#9333ea']
                      : ['#52525b', '#3f3f46', '#27272a']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createButtonGradient}
                  >
                    <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createButtonText}>
                      {isChina ? '创建预测' : 'Create Prediction'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Quick Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>
              {isChina ? '使用指南' : 'Quick Tips'}
            </Text>
            <View style={styles.tipCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                style={styles.tipGradient}
              >
                <View style={styles.tipIconContainer}>
                  <Text style={styles.tipIcon}>💡</Text>
                </View>
                <Text style={styles.tipText}>
                  {isChina 
                    ? '打卡越早，奖励越高！前期打卡点的奖励大于后期，错过即损失。'
                    : 'Early checkpoints have higher rewards! Missing a checkpoint = losing its reward.'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// 导入 React
import React from 'react';

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
    width: 400,
    height: 400,
    top: -200,
    left: -100,
  },
  auroraOrb2: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  auroraOrb3: {
    width: 350,
    height: 350,
    bottom: -200,
    left: '30%',
  },
  safeArea: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  avatarButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 28,
  },
  balanceOrbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 100,
  },
  decorOrbPurple: {
    width: 200,
    height: 200,
    top: -100,
    left: -50,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  decorOrbCyan: {
    width: 150,
    height: 150,
    bottom: -80,
    right: -40,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  balanceContent: {
    position: 'relative',
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -1.5,
  },
  balanceUnit: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 10,
    fontWeight: '500',
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },

  // Today Checkin Banner
  todayCheckinBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  todayCheckinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
  },
  todayCheckinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todayCheckinContent: {
    flex: 1,
  },
  todayCheckinTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34d399',
  },
  todayCheckinSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  todayCheckinButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  todayCheckinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Prediction Card
  predictionCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  predictionGradient: {
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 24,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  statusDotJudging: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  predictionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // Progress Section
  progressSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressMissed: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  progressStatText: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Stats Row
  predictionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statIconPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  statValueExpired: {
    color: '#ef4444',
  },
  statValuePurple: {
    fontSize: 17,
    fontWeight: '700',
    color: '#c084fc',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },

  // Empty State
  emptyCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderRadius: 24,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Tips Section
  tipsSection: {
    marginHorizontal: 24,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
