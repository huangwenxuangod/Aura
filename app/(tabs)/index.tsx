import { useCallback } from 'react';
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
import { useCountdown } from '@/hooks/useCountdown';
import { useRefresh } from '@/hooks/usePolling';
import { formatCredits } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { user, currentPrediction, recovery, fetchUser, fetchCurrentPrediction, fetchRecovery } = useUserStore();

  const { isRefreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([fetchUser(), fetchCurrentPrediction(), fetchRecovery()]);
  });

  const countdown = useCountdown(currentPrediction?.deadline || null);

  const handleCreatePrediction = () => {
    router.push('/prediction');
  };

  const handleViewPrediction = () => {
    if (currentPrediction) {
      router.push(`/(screens)/prediction/${currentPrediction.id}`);
    }
  };

  const isInRecovery = recovery && recovery.status === 'IN_PROGRESS';
  const canCreatePrediction = !currentPrediction && !isInRecovery;

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
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.username}>
                {user?.display_name || 'User'}
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
                {user?.avatar_url ? (
                  <Text style={styles.avatarText}>
                    {user.display_name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                ) : (
                  <Ionicons name="person" size={24} color="#c084fc" />
                )}
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
                <Text style={styles.balanceLabel}>Available Credits</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceValue}>
                    {formatCredits(user?.credit_balance || 0)}
                  </Text>
                  <Text style={styles.balanceUnit}>credits</Text>
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
                      <Text style={styles.primaryButtonText}>Recharge</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(screens)/history')}
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={18} color="#f8fafc" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryButtonText}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Streak Card */}
          <View style={styles.streakCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.streakGradient}
            >
              <View style={styles.streakIconContainer}>
                <Text style={styles.streakIcon}>🔥</Text>
              </View>
              <View style={styles.streakContent}>
                <Text style={styles.streakLabel}>Consecutive Successes</Text>
                <Text style={styles.streakValue}>
                  {user?.consecutive_successes || 0}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText}>
                  {(user?.consecutive_successes ?? 0) >= 5 ? '🏆 Elite' : (user?.consecutive_successes ?? 0) >= 3 ? '⭐ Rising' : '🌱 Growing'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Recovery Mode Banner */}
          {isInRecovery && (
            <View style={styles.recoveryBanner}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.recoveryGradient}
              >
                <View style={styles.recoveryHeader}>
                  <View style={styles.recoveryIconContainer}>
                    <Ionicons name="refresh" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.recoveryTitleContainer}>
                    <Text style={styles.recoveryTitle}>Recovery Mode</Text>
                    <Text style={styles.recoverySubtitle}>
                      {2 - (recovery.success_count || 0)} more to recover {formatCredits(recovery.original_stake)} credits
                    </Text>
                  </View>
                </View>
                <View style={styles.recoveryProgress}>
                  <View style={[styles.recoveryDot, recovery.success_count >= 1 && styles.recoveryDotActive]} />
                  <View style={styles.recoveryLine} />
                  <View style={[styles.recoveryDot, recovery.success_count >= 2 && styles.recoveryDotActive]} />
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Current Prediction */}
          {currentPrediction ? (
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
                      currentPrediction.status === 'ACTIVE' ? styles.statusDotActive : styles.statusDotJudging
                    ]} />
                    <Text style={styles.statusText}>
                      {currentPrediction.status === 'ACTIVE' ? 'Active Prediction' : 'Awaiting Judgment'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </View>

                {/* Prediction Content */}
                <Text style={styles.predictionTitle} numberOfLines={2}>
                  {currentPrediction.title}
                </Text>

                {currentPrediction.description && (
                  <Text style={styles.predictionDesc} numberOfLines={2}>
                    {currentPrediction.description}
                  </Text>
                )}

                {/* Stats Row */}
                <View style={styles.predictionStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="time-outline" size={16} color="#64748b" />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Time Left</Text>
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
                      <Text style={styles.statLabel}>Stake</Text>
                      <Text style={styles.statValuePurple}>
                        {formatCredits(currentPrediction.stake)}
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
                  {isInRecovery ? 'Continue Your Recovery' : 'No Active Prediction'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {isInRecovery
                    ? 'Create a new prediction to continue your recovery progress'
                    : 'Create a prediction and stake your commitment'}
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePrediction}
                  disabled={!canCreatePrediction && !isInRecovery}
                  style={styles.createButton}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={canCreatePrediction || isInRecovery
                      ? ['#c084fc', '#a855f7', '#9333ea']
                      : ['#52525b', '#3f3f46', '#27272a']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createButtonGradient}
                  >
                    <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createButtonText}>Create Prediction</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Quick Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Quick Tips</Text>
            <View style={styles.tipCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                style={styles.tipGradient}
              >
                <View style={styles.tipIconContainer}>
                  <Text style={styles.tipIcon}>💡</Text>
                </View>
                <Text style={styles.tipText}>
                  Start with small stakes to build your streak. Consistency is key!
                </Text>
              </LinearGradient>
            </View>
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
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c084fc',
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

  // Streak Card
  streakCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  streakIcon: {
    fontSize: 24,
  },
  streakContent: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  } as const,

  // Recovery Banner
  recoveryBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recoveryGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recoveryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recoveryTitleContainer: {
    flex: 1,
  },
  recoveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  recoverySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  recoveryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recoveryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recoveryDotActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  recoveryLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
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
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  predictionDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
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
