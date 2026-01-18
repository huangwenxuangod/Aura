import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface RefereeEntry {
  id: string;
  prediction_id: string;
  vote: string | null;
  voted_at: string | null;
  created_at: string;
  prediction: {
    id: string;
    title: string;
    status: string;
    deadline: string;
    total_stake: number;
    user: {
      display_name: string;
    } | null;
  };
}

export default function RefereeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [myRefereeEntries, setMyRefereeEntries] = useState<RefereeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMyRefereeEntries = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('referees')
        .select(`
          id,
          prediction_id,
          vote,
          voted_at,
          created_at,
          prediction:predictions (
            id,
            title,
            status,
            deadline,
            total_stake,
            user:user_profiles!predictions_user_id_fkey (
              display_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRefereeEntries((data || []) as unknown as RefereeEntry[]);
    } catch (error) {
      console.error('Failed to load referee entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyRefereeEntries();
  }, [loadMyRefereeEntries]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMyRefereeEntries();
    setIsRefreshing(false);
  };

  const handleJoinByCode = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 6) {
      Toast.show({ type: 'error', text1: '请输入有效的监督码' });
      return;
    }

    setIsJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      // 查找预测
      const { data: prediction, error: findError } = await supabase
        .from('predictions')
        .select('id, user_id, status')
        .eq('referee_code', trimmedCode)
        .single();

      if (findError || !prediction) {
        throw new Error('未找到此监督码对应的预测');
      }

      if (prediction.user_id === user.id) {
        throw new Error('不能监督自己的预测');
      }

      if (prediction.status !== 'active' && prediction.status !== 'judging') {
        throw new Error('此预测已结束，无法加入监督');
      }

      // 检查是否已加入
      const { data: existing } = await supabase
        .from('referees')
        .select('id')
        .eq('prediction_id', prediction.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // 已经是监督人，直接跳转
        router.push(`/(screens)/referee/${prediction.id}`);
        return;
      }

      // 加入监督
      const { error: joinError } = await supabase
        .from('referees')
        .insert({
          prediction_id: prediction.id,
          user_id: user.id,
        });

      if (joinError) throw joinError;

      Toast.show({ type: 'success', text1: '成功加入监督！' });
      setCode('');
      await loadMyRefereeEntries();
      router.push(`/(screens)/referee/${prediction.id}`);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: '进行中' };
      case 'judging':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: '待评审' };
      case 'settled':
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: '已结束' };
      default:
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: status };
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#c084fc" />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>监督</Text>
            <Text style={styles.headerSubtitle}>帮助朋友完成目标</Text>
          </View>

          {/* Join by Code */}
          <View style={styles.joinSection}>
            <Text style={styles.sectionTitle}>输入监督码</Text>
            <View style={styles.codeInputRow}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="例如: ABC12345"
                placeholderTextColor="#52525b"
                style={styles.codeInput}
                autoCapitalize="characters"
                maxLength={12}
              />
              <TouchableOpacity
                onPress={handleJoinByCode}
                disabled={isJoining || code.trim().length < 6}
                style={[
                  styles.joinButton,
                  code.trim().length >= 6 && styles.joinButtonActive,
                ]}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* My Referee Entries */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>我监督的预测 ({myRefereeEntries.length})</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c084fc" />
              </View>
            ) : myRefereeEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="eye-outline" size={48} color="#3f3f46" />
                <Text style={styles.emptyTitle}>还没有监督任何预测</Text>
                <Text style={styles.emptyText}>输入朋友分享的监督码开始监督</Text>
              </View>
            ) : (
              myRefereeEntries.map((entry) => {
                const statusStyle = getStatusStyle(entry.prediction.status);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    onPress={() => router.push(`/(screens)/referee/${entry.prediction_id}`)}
                    style={styles.entryCard}
                    activeOpacity={0.8}
                  >
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.prediction.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                          {statusStyle.label}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.entryMeta}>
                      <View style={styles.entryMetaItem}>
                        <Ionicons name="person-outline" size={14} color="#64748b" />
                        <Text style={styles.entryMetaText}>
                          {entry.prediction.user?.display_name || '匿名用户'}
                        </Text>
                      </View>
                      <View style={styles.entryMetaItem}>
                        <Ionicons name="diamond-outline" size={14} color="#c084fc" />
                        <Text style={styles.entryMetaText}>
                          {entry.prediction.total_stake}
                        </Text>
                      </View>
                      <View style={styles.entryMetaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.entryMetaText}>
                          {formatDate(entry.prediction.deadline)}
                        </Text>
                      </View>
                    </View>

                    {entry.prediction.status === 'judging' && (
                      <View style={styles.voteStatus}>
                        {entry.vote ? (
                          <View style={[
                            styles.votedBadge,
                            { backgroundColor: entry.vote === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }
                          ]}>
                            <Ionicons
                              name={entry.vote === 'success' ? 'checkmark-circle' : 'close-circle'}
                              size={16}
                              color={entry.vote === 'success' ? '#10b981' : '#ef4444'}
                            />
                            <Text style={[
                              styles.votedText,
                              { color: entry.vote === 'success' ? '#10b981' : '#ef4444' }
                            ]}>
                              已投票: {entry.vote === 'success' ? '成功' : '失败'}
                            </Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                            style={styles.needVoteBadge}
                          >
                            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                            <Text style={styles.needVoteText}>需要投票</Text>
                          </LinearGradient>
                        )}
                      </View>
                    )}

                    <View style={styles.entryArrow}>
                      <Ionicons name="chevron-forward" size={20} color="#52525b" />
                    </View>
                  </TouchableOpacity>
                );
              })
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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  joinSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '600',
    letterSpacing: 2,
  },
  joinButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonActive: {
    backgroundColor: '#a855f7',
  },
  listSection: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingRight: 24,
  },
  entryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  entryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryMetaText: {
    fontSize: 13,
    color: '#64748b',
  },
  voteStatus: {
    marginTop: 12,
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  votedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  needVoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  needVoteText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f59e0b',
  },
  entryArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
});
