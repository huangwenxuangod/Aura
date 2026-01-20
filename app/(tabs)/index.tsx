import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { usePredictionStore } from '@/stores/usePredictionStore';
import { useCountdown } from '@/hooks/useCountdown';
import { triggerJudging, getReferees } from '@/services/prediction.service';
import { ShareModal } from '@/components/ShareModal';
import { formatCredits } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { user, fetchUser } = useUserStore();
  const { currentPrediction, fetchCurrentPrediction, isLoading } = usePredictionStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const countdown = useCountdown(currentPrediction?.deadline || null);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUser(), fetchCurrentPrediction()]);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchCurrentPrediction();
  }, []);

  const handleViewPrediction = () => {
    if (currentPrediction) {
      router.push(`/(screens)/prediction/${currentPrediction.id}`);
    }
  };

  const handleCopyCode = () => {
    if (currentPrediction?.referee_code) {
      Clipboard.setString(currentPrediction.referee_code);
      Toast.show({ type: 'success', text1: '监督码已复制' });
    }
  };

  const handleRequestJudging = async () => {
    if (!currentPrediction) return;

    // 检查是否有评审者
    const referees = await getReferees(currentPrediction.id);
    
    if (referees.length === 0) {
      // 没有评审者，显示分享弹窗
      setShowShareModal(true);
      return;
    }

    // 有评审者，触发评审
    setIsTriggering(true);
    try {
      await triggerJudging(currentPrediction.id);
      await fetchCurrentPrediction();
      Toast.show({ type: 'success', text1: '已请求评审' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    } finally {
      setIsTriggering(false);
    }
  };

  const canTriggerJudging = currentPrediction?.status === 'active' && countdown.isExpired;
  const hasActivePrediction = currentPrediction && 
    (currentPrediction.status === 'active' || currentPrediction.status === 'judging');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
            />
          }
        >
          {/* Header - 只显示用户名和头像 */}
          <View style={styles.header}>
            <Text style={styles.username}>{user?.display_name || '用户'}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatarButton}
            >
              <Ionicons name="person" size={22} color="#a855f7" />
            </TouchableOpacity>
          </View>

          {/* Balance Card - 统一背景 */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>可用积分</Text>
            <Text style={styles.balanceValue}>{formatCredits(user?.credits || 0)}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(screens)/recharge')}
              style={styles.rechargeButton}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.rechargeButtonText}>充值</Text>
            </TouchableOpacity>
          </View>

          {/* Prediction Section */}
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : hasActivePrediction ? (
            <View style={styles.predictionCard}>
              {/* Status */}
              <View style={styles.predictionHeader}>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusDot,
                    currentPrediction.status === 'active' ? styles.statusActive : styles.statusJudging
                  ]} />
                  <Text style={styles.statusText}>
                    {currentPrediction.status === 'active' ? '进行中' : '评审中'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleViewPrediction}>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <TouchableOpacity onPress={handleViewPrediction}>
                <Text style={styles.predictionTitle} numberOfLines={2}>
                  {currentPrediction.title}
                </Text>
              </TouchableOpacity>

              {/* Countdown - 无额外背景 */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {countdown.isExpired ? '已到截止时间' : '剩余时间'}
                </Text>
                <Text style={[
                  styles.infoValue,
                  countdown.isExpired && styles.infoValueExpired
                ]}>
                  {countdown.formatted}
                </Text>
              </View>

              {/* Referee Code - 无额外背景 */}
              <View style={styles.codeRow}>
                <View>
                  <Text style={styles.infoLabel}>监督码</Text>
                  <Text style={styles.codeValue}>{currentPrediction.referee_code}</Text>
                </View>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>复制</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              {currentPrediction.status === 'active' && (
                <TouchableOpacity
                  onPress={handleRequestJudging}
                  disabled={!canTriggerJudging || isTriggering}
                  style={[
                    styles.judgingButton,
                    !canTriggerJudging && styles.judgingButtonDisabled
                  ]}
                >
                  {isTriggering ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[
                      styles.judgingButtonText,
                      !canTriggerJudging && styles.judgingButtonTextDisabled
                    ]}>
                      {canTriggerJudging ? '请求评审' : '未到截止时间'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Empty State */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>没有进行中的预测</Text>
              <Text style={styles.emptyDesc}>
                创建一个预测，押注你的承诺
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/prediction')}
                style={styles.createButton}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>创建预测</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Share Modal */}
      {currentPrediction && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          prediction={currentPrediction}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  rechargeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Loading
  loadingCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },

  // Prediction Card
  predictionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusJudging: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 13,
    color: '#64748b',
  },
  predictionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 20,
    lineHeight: 26,
  },

  // Info Row - 统一背景
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  infoValueExpired: {
    color: '#ef4444',
  },

  // Code Row
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a855f7',
    letterSpacing: 2,
    marginTop: 2,
  },
  copyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  copyButtonText: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '500',
  },

  // Judging Button
  judgingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 16,
  },
  judgingButtonDisabled: {
    backgroundColor: '#27272a',
  },
  judgingButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  judgingButtonTextDisabled: {
    color: '#52525b',
  },

  // Empty State
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
