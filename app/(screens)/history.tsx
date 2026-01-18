import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserPredictions } from '@/services/prediction.service';
import { useUserStore } from '@/stores/useUserStore';
import { useRefresh } from '@/hooks/usePolling';
import { formatCredits, formatDate } from '@/lib/utils';
import type { Prediction } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const data = await getUserPredictions();
    setPredictions(data);
  }, [user]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  // 新系统使用小写状态: active, judging, settled
  // settled 状态通过 final_result 区分 success/failure
  const getStatusConfig = (prediction: Prediction) => {
    const configs: Record<string, any> = {
      active: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: '进行中', icon: 'flag' },
      judging: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: '评审中', icon: 'time' },
    };

    if (prediction.status === 'settled') {
      if (prediction.final_result === 'success') {
        return { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: '成功', icon: 'checkmark-circle' };
      } else {
        return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: '失败', icon: 'close-circle' };
      }
    }

    return configs[prediction.status] || configs.active;
  };

  // 统计数据
  const stats = {
    total: predictions.length,
    success: predictions.filter(p => p.status === 'settled' && p.final_result === 'success').length,
    failed: predictions.filter(p => p.status === 'settled' && p.final_result === 'failure').length,
    active: predictions.filter(p => p.status === 'active' || p.status === 'judging').length,
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'transparent']} style={styles.loadingGradient} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>加载中...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Aurora Background */}
      <View style={styles.auroraContainer}>
        <LinearGradient colors={['rgba(168, 85, 247, 0.12)', 'transparent']} style={[styles.auroraOrb, styles.auroraOrb1]} />
        <LinearGradient colors={['rgba(6, 182, 212, 0.1)', 'transparent']} style={[styles.auroraOrb, styles.auroraOrb2]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#c084fc" />}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>预测历史</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>总计</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>成功</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.success}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>失败</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.failed}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>进行中</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.active}</Text>
            </View>
          </View>

          {/* Predictions List */}
          {predictions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={64} color="#3f3f46" />
              <Text style={styles.emptyTitle}>还没有预测</Text>
              <Text style={styles.emptySubtitle}>创建你的第一个预测开始吧</Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/prediction')} 
                style={styles.createButton}
              >
                <LinearGradient colors={['#c084fc', '#a855f7']} style={styles.createButtonGradient}>
                  <Text style={styles.createButtonText}>创建预测</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            predictions.map((prediction) => {
              const config = getStatusConfig(prediction);
              return (
                <TouchableOpacity
                  key={prediction.id}
                  onPress={() => router.push(`/(screens)/prediction/${prediction.id}`)}
                  style={styles.predictionCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.predictionHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                      <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525b" />
                  </View>

                  <Text style={styles.predictionTitle} numberOfLines={2}>
                    {prediction.title}
                  </Text>

                  <View style={styles.predictionFooter}>
                    <Text style={styles.predictionDate}>{formatDate(prediction.created_at)}</Text>
                    <Text style={styles.predictionStake}>{prediction.total_stake} 积分</Text>
                  </View>

                  {/* 打卡进度条 */}
                  <View style={styles.progressContainer}>
                    <View style={styles.miniProgressBar}>
                      <View 
                        style={[
                          styles.miniProgressFill, 
                          { 
                            width: `${(prediction.earned_checkin_reward / (prediction.checkin_reward || 1)) * 100}%`,
                            backgroundColor: '#10b981'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      打卡: {prediction.earned_checkin_reward}/{prediction.checkin_reward}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  auroraContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  auroraOrb: { position: 'absolute', borderRadius: 200 },
  auroraOrb1: { width: 350, height: 350, top: -150, left: -100 },
  auroraOrb2: { width: 280, height: 280, top: -80, right: -80 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSpacer: { width: 40 },
  statsContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 14, 
    padding: 14, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  statLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '600', marginTop: 20 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
  createButton: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  createButtonGradient: { paddingVertical: 14, paddingHorizontal: 32 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  predictionCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  predictionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  predictionTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '600', marginBottom: 12, lineHeight: 24 },
  predictionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  predictionDate: { color: '#64748b', fontSize: 13 },
  predictionStake: { color: '#c084fc', fontSize: 14, fontWeight: '600' },
  progressContainer: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniProgressBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  progressText: { color: '#64748b', fontSize: 11 },
});