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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import {
  getPredictionByRefereeCode,
  getReferees,
  getCheckIns,
  joinAsReferee,
  submitVote,
} from '@/services/prediction.service';
import { useCountdown } from '@/hooks/useCountdown';
import { useRefresh } from '@/hooks/usePolling';
import { formatCredits, formatDate } from '@/lib/utils';
import type { Prediction, Referee, CheckIn } from '@/types';

export default function RefereeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const countdown = useCountdown(prediction?.deadline || null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
      setIsAuthenticated(!!user);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!code) return;

    const predictionData = await getPredictionByRefereeCode(code);
    if (predictionData) {
      const [refereesData, checkInsData] = await Promise.all([
        getReferees(predictionData.id),
        getCheckIns(predictionData.id),
      ]);

      setPrediction(predictionData);
      setReferees(refereesData);
      setCheckIns(checkInsData);
    }
  }, [code]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  const isReferee = referees.some((r) => r.user_id === currentUserId);
  const currentReferee = referees.find((r) => r.user_id === currentUserId);
  const hasVoted = currentReferee?.vote !== null;
  const canVote = prediction?.status === 'JUDGING' && isReferee && !hasVoted;
  const isCreator = prediction?.user_id === currentUserId;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to become a referee.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    if (isCreator) {
      Toast.show({
        type: 'error',
        text1: 'Cannot join your own prediction',
      });
      return;
    }

    setIsJoining(true);
    try {
      await joinAsReferee(prediction!.id);
      await loadData();
      Toast.show({
        type: 'success',
        text1: 'You are now a referee!',
        text2: 'You can vote when judgment is requested',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to join',
        text2: error.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleVote = (vote: 'YES' | 'NO') => {
    Alert.alert(
      `Vote ${vote === 'YES' ? 'Success' : 'Failure'}`,
      `Are you sure you want to vote that this prediction ${vote === 'YES' ? 'succeeded' : 'failed'}? This cannot be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsVoting(true);
            try {
              await submitVote(prediction!.id, vote);
              await loadData();
              Toast.show({
                type: 'success',
                text1: 'Vote submitted!',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Failed to vote',
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
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#c084fc" />
          </View>
          <Text style={styles.loadingText}>Loading prediction...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // Error State - Invalid Code
  if (!prediction) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.1)', 'transparent']}
          style={styles.errorGradient}
        />
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
              style={styles.errorIconGradient}
            >
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
            </LinearGradient>
          </View>
          <Text style={styles.errorTitle}>Invalid Referee Code</Text>
          <Text style={styles.errorDesc}>
            This referee code doesn't exist or has expired.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.errorButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
              style={styles.errorButtonGradient}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const creator = (prediction as any).users;

  const statusConfig = {
    ACTIVE: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: 'Active' },
    JUDGING: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Awaiting Your Vote' },
    SUCCESS: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: 'Completed - Success' },
    FAILED: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Completed - Failed' },
    CANCELLED: { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.15)', label: 'Cancelled' },
  };

  const currentStatus = statusConfig[prediction.status] || statusConfig.ACTIVE;

  // Vote results
  const yesVotes = referees.filter((r) => r.vote === 'YES').length;
  const noVotes = referees.filter((r) => r.vote === 'NO').length;
  const totalVotes = yesVotes + noVotes;

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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={22} color="#f8fafc" />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>Referee View</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Creator Info */}
          <View style={styles.creatorSection}>
            <View style={styles.creatorCard}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                style={styles.creatorGradient}
              >
                <View style={styles.creatorInfo}>
                  <View style={styles.creatorAvatar}>
                    <LinearGradient
                      colors={['#c084fc', '#a855f7', '#9333ea']}
                      style={styles.creatorAvatarGradient}
                    >
                      <Text style={styles.creatorAvatarText}>
                        {creator?.display_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.creatorDetails}>
                    <Text style={styles.creatorName}>
                      {creator?.display_name || 'Anonymous'}
                    </Text>
                    <Text style={styles.creatorLabel}>is predicting</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: currentStatus.bgColor }]}>
                  <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
                  <Text style={[styles.statusText, { color: currentStatus.color }]}>
                    {currentStatus.label}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Prediction Content */}
          <View style={styles.predictionSection}>
            <Text style={styles.predictionTitle}>{prediction.title}</Text>
            {prediction.description && (
              <Text style={styles.predictionDesc}>{prediction.description}</Text>
            )}
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                style={styles.infoCardGradient}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                <Text style={styles.infoCardLabel}>Deadline</Text>
                <Text style={styles.infoCardValue}>{formatDate(prediction.deadline)}</Text>
              </LinearGradient>
            </View>
            <View style={styles.infoCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                style={styles.infoCardGradient}
              >
                <Ionicons name="time-outline" size={20} color="#64748b" />
                <Text style={styles.infoCardLabel}>Time Left</Text>
                <Text style={[
                  styles.infoCardValue,
                  countdown.isExpired && styles.infoCardValueExpired
                ]}>
                  {countdown.formatted}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Stake Card */}
          <View style={styles.stakeCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.03)']}
              style={styles.stakeGradient}
            >
              <View style={styles.stakeIconContainer}>
                <Ionicons name="diamond" size={22} color="#c084fc" />
              </View>
              <View style={styles.stakeContent}>
                <Text style={styles.stakeLabel}>Stake</Text>
                <Text style={styles.stakeValue}>
                  {prediction.is_recovery ? 'Recovery Mode' : `${formatCredits(prediction.stake)} credits`}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Check-ins */}
          <View style={styles.checkInsSection}>
            <Text style={styles.sectionTitle}>
              Check-in Records ({checkIns.length})
            </Text>

            {checkIns.length === 0 ? (
              <View style={styles.emptyCheckIns}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                  style={styles.emptyCheckInsGradient}
                >
                  <Ionicons name="document-text-outline" size={32} color="#3f3f46" />
                  <Text style={styles.emptyCheckInsText}>No check-ins yet</Text>
                </LinearGradient>
              </View>
            ) : (
              checkIns.map((checkIn, index) => (
                <View key={checkIn.id} style={styles.checkInCard}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.checkInGradient}
                  >
                    <View style={styles.checkInNumber}>
                      <Text style={styles.checkInNumberText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.checkInContent}>
                      <Text style={styles.checkInText}>{checkIn.content}</Text>
                      <Text style={styles.checkInDate}>{formatDate(checkIn.created_at)}</Text>
                    </View>
                  </LinearGradient>
                </View>
              ))
            )}
          </View>

          {/* Voting Results */}
          {prediction.status === 'JUDGING' && totalVotes > 0 && (
            <View style={styles.votingSection}>
              <Text style={styles.sectionTitle}>Current Votes</Text>
              <View style={styles.votingCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.votingGradient}
                >
                  <View style={styles.votingRow}>
                    <View style={styles.voteItem}>
                      <View style={[styles.voteIcon, styles.voteIconSuccess]}>
                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      </View>
                      <Text style={styles.voteLabel}>Success</Text>
                      <Text style={styles.voteCount}>{yesVotes}</Text>
                    </View>
                    <View style={styles.voteDivider} />
                    <View style={styles.voteItem}>
                      <View style={[styles.voteIcon, styles.voteIconFail]}>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </View>
                      <Text style={styles.voteLabel}>Failed</Text>
                      <Text style={styles.voteCount}>{noVotes}</Text>
                    </View>
                  </View>
                  <View style={styles.voteProgressTrack}>
                    {yesVotes > 0 && (
                      <View style={[styles.voteProgressBar, styles.voteProgressSuccess, { flex: yesVotes }]} />
                    )}
                    {noVotes > 0 && (
                      <View style={[styles.voteProgressBar, styles.voteProgressFail, { flex: noVotes }]} />
                    )}
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Action Section */}
          <View style={styles.actionSection}>
            {/* Join Button */}
            {!isReferee && !isCreator && prediction.status === 'ACTIVE' && (
              <TouchableOpacity
                onPress={handleJoin}
                disabled={isJoining}
                style={styles.actionButton}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#c084fc', '#a855f7', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="people" size={22} color="#fff" style={{ marginRight: 10 }} />
                      <Text style={styles.actionButtonText}>Become a Referee</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Referee Status */}
            {isReferee && !canVote && prediction.status !== 'JUDGING' && (
              <View style={styles.statusCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.03)']}
                  style={styles.statusCardGradient}
                >
                  <View style={styles.statusCardIcon}>
                    <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                  </View>
                  <Text style={styles.statusCardTitle}>You're a Referee</Text>
                  <Text style={styles.statusCardDesc}>
                    You'll be notified when judgment is requested
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Voting Buttons */}
            {canVote && (
              <View style={styles.votingButtons}>
                <Text style={styles.votingPrompt}>Did they achieve their prediction?</Text>
                <View style={styles.voteButtonsRow}>
                  <TouchableOpacity
                    onPress={() => handleVote('YES')}
                    disabled={isVoting}
                    style={[styles.voteButton, styles.voteButtonSuccess]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#34d399', '#10b981', '#059669']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={28} color="#fff" />
                          <Text style={styles.voteButtonText}>Yes</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleVote('NO')}
                    disabled={isVoting}
                    style={[styles.voteButton, styles.voteButtonFail]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#f87171', '#ef4444', '#dc2626']}
                      style={styles.voteButtonGradient}
                    >
                      {isVoting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close" size={28} color="#fff" />
                          <Text style={styles.voteButtonText}>No</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Already Voted */}
            {hasVoted && prediction.status === 'JUDGING' && (
              <View style={styles.statusCard}>
                <LinearGradient
                  colors={currentReferee?.vote === 'YES' 
                    ? ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.03)']
                    : ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.03)']
                  }
                  style={styles.statusCardGradient}
                >
                  <View style={styles.statusCardIcon}>
                    <Ionicons
                      name={currentReferee?.vote === 'YES' ? 'checkmark-circle' : 'close-circle'}
                      size={28}
                      color={currentReferee?.vote === 'YES' ? '#10b981' : '#ef4444'}
                    />
                  </View>
                  <Text style={styles.statusCardTitle}>
                    You voted: {currentReferee?.vote === 'YES' ? 'Success' : 'Failed'}
                  </Text>
                  <Text style={styles.statusCardDesc}>
                    Waiting for other referees to vote
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Creator Notice */}
            {isCreator && (
              <View style={styles.statusCard}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.03)']}
                  style={styles.statusCardGradient}
                >
                  <View style={styles.statusCardIcon}>
                    <Ionicons name="information-circle" size={28} color="#f59e0b" />
                  </View>
                  <Text style={[styles.statusCardTitle, { color: '#fbbf24' }]}>
                    This is your prediction
                  </Text>
                  <Text style={styles.statusCardDesc}>
                    You cannot be a referee for your own prediction
                  </Text>
                </LinearGradient>
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
    paddingBottom: 120,
  },

  // Loading State
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
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },

  // Error State
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
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 44,
  },

  // Creator Section
  creatorSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  creatorCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  creatorGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 22,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorAvatar: {
    marginRight: 14,
  },
  creatorAvatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
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

  // Prediction Section
  predictionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  predictionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  predictionDesc: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },

  // Info Cards
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  infoCardGradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  infoCardValueExpired: {
    color: '#ef4444',
  },

  // Stake Card
  stakeCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  stakeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 18,
  },
  stakeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stakeContent: {
    flex: 1,
  },
  stakeLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  stakeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#c084fc',
    marginTop: 2,
  },

  // Check-ins Section
  checkInsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCheckIns: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  emptyCheckInsGradient: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
  },
  emptyCheckInsText: {
    fontSize: 14,
    color: '#52525b',
    marginTop: 12,
  },
  checkInCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkInGradient: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
  },
  checkInNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkInNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c084fc',
  },
  checkInContent: {
    flex: 1,
  },
  checkInText: {
    fontSize: 15,
    color: '#f8fafc',
    lineHeight: 21,
  },
  checkInDate: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 8,
  },

  // Voting Section
  votingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  votingCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  votingGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  votingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  voteItem: {
    flex: 1,
    alignItems: 'center',
  },
  voteIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  voteIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  voteIconFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  voteLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  voteProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  voteProgressBar: {
    height: 8,
  },
  voteProgressSuccess: {
    backgroundColor: '#10b981',
  },
  voteProgressFail: {
    backgroundColor: '#ef4444',
  },

  // Action Section
  actionSection: {
    paddingHorizontal: 24,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusCardGradient: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  statusCardIcon: {
    marginBottom: 12,
  },
  statusCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  statusCardDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Voting Buttons
  votingButtons: {
    alignItems: 'center',
  },
  votingPrompt: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 20,
    textAlign: 'center',
  },
  voteButtonsRow: {
    flexDirection: 'row',
    gap: 14,
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
    paddingVertical: 22,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 6,
  },
});
