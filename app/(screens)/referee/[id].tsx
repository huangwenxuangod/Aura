import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';

interface PredictionForReferee {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  status: string;
  total_stake: number;
  checkin_reward: number;
  result_reward: number;
  final_result: string | null;
  created_at: string;
}

interface CheckinRecord {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  checkin_point?: {
    point_index: number;
    reward_amount: number;
  };
}

interface CheckinPointRecord {
  id: string;
  point_index: number;
  due_date: string;
  status: string;
  reward_amount: number;
}

export default function RefereeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [prediction, setPrediction] = useState<PredictionForReferee | null>(null);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [checkinPoints, setCheckinPoints] = useState<CheckinPointRecord[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const countdown = useCountdown(prediction?.deadline || null);

  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 加载预测信息
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('id, title, description, deadline, status, total_stake, checkin_reward, result_reward, final_result, created_at')
        .eq('id', id)
        .single();

      if (predError) throw predError;
      setPrediction(predData);

      // 加载打卡记录
      const { data: checkinData } = await supabase
        .from('checkins')
        .select(`
          id, content, image_url, created_at,
          checkin_point:checkin_points (
            point_index, reward_amount
          )
        `)
        .eq('prediction_id', id)
        .order('created_at', { ascending: false });

      setCheckins((checkinData || []) as unknown as CheckinRecord[]);

      // 加载打卡点
      const { data: pointsData } = await supabase
        .from('checkin_points')
        .select('id, point_index, due_date, status, reward_amount')
        .eq('prediction_id', id)
        .order('point_index', { ascending: true });

      setCheckinPoints(pointsData || []);

      // 加载我的投票状态
      const { data: refereeData } = await supabase
        .from('referees')
        .select('vote')
        .eq('prediction_id', id)
        .eq('user_id', user.id)
        .single();

      if (refereeData) {
        setMyVote(refereeData.vote);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleVote = (voteType: 'success' | 'failure') => {
    Alert.alert(
      '确认投票',
      `你确定要投票「${voteType === 'success' ? '成功' : '失败'}」吗？投票后不可更改。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            setIsVoting(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('请先登录');

              const { error } = await supabase
                .from('referees')
                .update({
                  vote: voteType,
                  voted_at: new Date().toISOString(),
                })
                .eq('prediction_id', id)
                .eq('user_id', user.id);

              if (error) throw error;

              setMyVote(voteType);
              Toast.show({
                type: 'success',
                text1: '投票成功',
                text2: `你投票了「${voteType === 'success' ? '成功' : '失败'}」`,
              });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message });
            } finally {
              setIsVoting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>加载中...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>预测不存在</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>返回</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: '进行中' };
      case 'judging':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: '待评审' };
      case 'settled':
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: prediction.final_result === 'success' ? '成功' : '失败' };
      default:
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: status };
    }
  };

  const statusStyle = getStatusStyle(prediction.status);
  const completedPoints = checkinPoints.filter(p => p.status === 'completed').length;
  const missedPoints = checkinPoints.filter(p => p.status === 'missed').length;

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerLabel}>监督模式</Text>
          </View>

          {/* Status Badge */}
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{prediction.title}</Text>
            {prediction.description && (
              <Text style={styles.description}>{prediction.description}</Text>
            )}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="diamond" size={14} color="#c084fc" />
                <Text style={styles.metaText}>{prediction.total_stake} Credits</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.metaText}>{formatDate(prediction.deadline)}</Text>
              </View>
            </View>
          </View>

          {/* Countdown */}
          {prediction.status === 'active' && (
            <View style={styles.countdownCard}>
              <Text style={styles.countdownLabel}>剩余时间</Text>
              <Text style={[styles.countdownValue, countdown.isExpired && styles.countdownExpired]}>
                {countdown.formatted}
              </Text>
            </View>
          )}

          {/* Checkin Progress */}
          {checkinPoints.length > 0 && (
            <View style={styles.progressCard}>
              <Text style={styles.sectionTitle}>📍 打卡进度</Text>
              <View style={styles.progressStats}>
                <View style={styles.progressStatItem}>
                  <Text style={[styles.progressStatValue, { color: '#10b981' }]}>{completedPoints}</Text>
                  <Text style={styles.progressStatLabel}>已完成</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                  <Text style={[styles.progressStatValue, { color: '#ef4444' }]}>{missedPoints}</Text>
                  <Text style={styles.progressStatLabel}>已错过</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                  <Text style={styles.progressStatValue}>{checkinPoints.length - completedPoints - missedPoints}</Text>
                  <Text style={styles.progressStatLabel}>待完成</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${(completedPoints / checkinPoints.length) * 100}%` }]} />
              </View>
            </View>
          )}

          {/* Checkins List */}
          <View style={styles.checkinsSection}>
            <Text style={styles.sectionTitle}>打卡记录 ({checkins.length})</Text>
            {checkins.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={32} color="#3f3f46" />
                <Text style={styles.emptyText}>暂无打卡记录</Text>
              </View>
            ) : (
              checkins.map((checkin) => (
                <View key={checkin.id} style={styles.checkinCard}>
                  {checkin.checkin_point && (
                    <View style={styles.checkinPointBadge}>
                      <Text style={styles.checkinPointText}>
                        打卡点 {checkin.checkin_point.point_index} (+{checkin.checkin_point.reward_amount})
                      </Text>
                    </View>
                  )}
                  <Text style={styles.checkinContent}>{checkin.content}</Text>
                  <Text style={styles.checkinDate}>{formatDate(checkin.created_at)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Voting Section */}
          {prediction.status === 'judging' && (
            <View style={styles.voteSection}>
              <Text style={styles.sectionTitle}>投票评审</Text>
              {myVote ? (
                <View style={styles.votedCard}>
                  <Ionicons
                    name={myVote === 'success' ? 'checkmark-circle' : 'close-circle'}
                    size={48}
                    color={myVote === 'success' ? '#10b981' : '#ef4444'}
                  />
                  <Text style={styles.votedTitle}>你已投票</Text>
                  <Text style={[styles.votedResult, { color: myVote === 'success' ? '#10b981' : '#ef4444' }]}>
                    {myVote === 'success' ? '成功' : '失败'}
                  </Text>
                </View>
              ) : (
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    onPress={() => handleVote('success')}
                    disabled={isVoting}
                    style={styles.voteButton}
                  >
                    <LinearGradient
                      colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#10b981" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                          <Text style={[styles.voteButtonText, { color: '#10b981' }]}>成功</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleVote('failure')}
                    disabled={isVoting}
                    style={styles.voteButton}
                  >
                    <LinearGradient
                      colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#ef4444" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={32} color="#ef4444" />
                          <Text style={[styles.voteButtonText, { color: '#ef4444' }]}>失败</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.voteHint}>
                根据打卡内容判断用户是否完成了目标
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginTop: 16 },
  errorButton: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorButtonText: { color: '#fff', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  backButton: { padding: 8 },
  headerLabel: { fontSize: 13, color: '#c084fc', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statusSection: { marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 13, fontWeight: '600' },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.3 },
  description: { fontSize: 15, color: '#64748b', marginTop: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#94a3b8', fontSize: 13 },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 10 },
  countdownCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  countdownLabel: { color: '#64748b', fontSize: 13, marginBottom: 4 },
  countdownValue: { color: '#f8fafc', fontSize: 32, fontWeight: '700' },
  countdownExpired: { color: '#ef4444' },
  progressCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  progressStatItem: { alignItems: 'center' },
  progressStatValue: { fontSize: 24, fontWeight: '700', color: '#f8fafc' },
  progressStatLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  progressStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  checkinsSection: { marginBottom: 20 },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyText: { color: '#52525b', fontSize: 14, marginTop: 12 },
  checkinCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkinPointBadge: { backgroundColor: 'rgba(168, 85, 247, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  checkinPointText: { color: '#c084fc', fontSize: 12, fontWeight: '600' },
  checkinContent: { color: '#f8fafc', fontSize: 15, lineHeight: 22 },
  checkinDate: { color: '#52525b', fontSize: 12, marginTop: 8 },
  voteSection: { marginBottom: 20 },
  votedCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  votedTitle: { fontSize: 16, color: '#64748b', marginTop: 12 },
  votedResult: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  voteButtons: { flexDirection: 'row', gap: 12 },
  voteButton: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  voteButtonGradient: { paddingVertical: 24, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  voteButtonText: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  voteHint: { color: '#52525b', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
