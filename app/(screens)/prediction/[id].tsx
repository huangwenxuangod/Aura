import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
  Clipboard,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useRefresh } from '@/hooks/usePolling';
import {
  getPredictionDetail,
  getReferees,
  getCheckins,
  triggerJudging,
  cancelPrediction,
  createCheckin,
  calculateCheckinProgress,
} from '@/services/prediction.service';
import {
  pickImageFromLibrary,
  takePhoto,
  uploadCheckInImage,
  UploadProgress,
} from '@/services/image.service';
import { generateShareText } from '@/services/share.service';
import { formatCredits, formatDate } from '@/lib/utils';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { ImagePreview, CheckInImage } from '@/components/ImagePreview';
import { FullScreenImage } from '@/components/FullScreenImage';
import type { PredictionDetail, Referee, Checkin, CheckinPoint } from '@/types';

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchUser } = useUserStore();

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInContent, setCheckInContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 图片相关状态
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const countdown = useCountdown(prediction?.deadline || null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await getPredictionDetail(id);
    setPrediction(data);
  }, [id]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  // 计算打卡进度
  const checkinProgress = prediction?.checkin_points 
    ? calculateCheckinProgress(prediction.checkin_points)
    : null;

  const canCancel = prediction && prediction.status === 'active' && 
    new Date().getTime() - new Date(prediction.created_at).getTime() < 5 * 60 * 1000;

  const canTriggerJudging = prediction && prediction.status === 'active' && 
    (prediction.referees?.length || 0) > 0;

  const handleTriggerJudging = () => {
    Alert.alert(
      '请求评审',
      '确定要请求裁判们进行评审吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await triggerJudging(id!);
              await loadData();
              Toast.show({ type: 'success', text1: '已请求评审' });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message });
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      '取消预测',
      '确定要取消这个预测吗？你的押注将被退还。',
      [
        { text: '否', style: 'cancel' },
        {
          text: '是，取消',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelPrediction(id!);
              await fetchUser();
              Toast.show({ type: 'success', text1: '预测已取消' });
              router.back();
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message });
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const shareText = generateShareText(prediction!);
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      Clipboard.setString(prediction?.referee_code || '');
      Toast.show({
        type: 'success',
        text1: '监督码已复制！',
        text2: prediction?.referee_code,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: '复制失败' });
    }
  };

  // 选择图片
  const handlePickFromLibrary = async () => {
    setShowImagePicker(false);
    try {
      const result = await pickImageFromLibrary();
      if (result) setSelectedImage(result.uri);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  const handleTakePhoto = async () => {
    setShowImagePicker(false);
    try {
      const result = await takePhoto();
      if (result) setSelectedImage(result.uri);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  const handleRemoveImage = () => setSelectedImage(null);

  // 提交打卡
  const handleCheckIn = async () => {
    if (!checkInContent.trim() || checkInContent.trim().length < 10) {
      Toast.show({ type: 'error', text1: '打卡内容至少需要10个字符' });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(!!selectedImage);
    setUploadProgress(0);

    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        imageUrl = await uploadCheckInImage(
          id!,
          selectedImage,
          (progress: UploadProgress) => setUploadProgress(progress.percentage)
        );
      }

      await createCheckin({
        prediction_id: id!,
        content: checkInContent.trim(),
        image_url: imageUrl,
      });
      
      setCheckInContent('');
      setSelectedImage(null);
      await loadData();
      
      Toast.show({ type: 'success', text1: '打卡成功！' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
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

  // 状态配置（新系统使用小写）
  const statusConfig: Record<string, any> = {
    active: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: '进行中' },
    judging: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: '评审中' },
    settled: { 
      color: prediction.final_result === 'success' ? '#10b981' : '#ef4444',
      bgColor: prediction.final_result === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      label: prediction.final_result === 'success' ? '成功' : '失败'
    },
  };
  const currentStatus = statusConfig[prediction.status] || statusConfig.active;
  const referees = prediction.referees || [];
  const checkins = prediction.checkins || [];

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
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={22} color="#fff" />
              </TouchableOpacity>
              {canCancel && (
                <TouchableOpacity onPress={handleCancel} style={[styles.headerButton, styles.cancelButton]}>
                  <Ionicons name="close" size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: currentStatus.bgColor }]}>
              <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
              <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
            </View>
          </View>

          {/* Title & Basic Info */}
          <View style={styles.titleSection}>
            <Text style={styles.predictionTitle}>{prediction.title}</Text>
            {prediction.description && <Text style={styles.predictionDesc}>{prediction.description}</Text>}
            <View style={styles.basicInfoRow}>
              <View style={styles.basicInfoItem}>
                <Ionicons name="diamond" size={14} color="#c084fc" />
                <Text style={styles.basicInfoText}>{prediction.total_stake} Credits</Text>
              </View>
              <View style={styles.basicInfoDot} />
              <View style={styles.basicInfoItem}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.basicInfoText}>{formatDate(prediction.deadline)}</Text>
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
          {checkinProgress && (
            <View style={styles.progressCard}>
              <Text style={styles.sectionTitle}>📍 打卡进度</Text>
              <View style={styles.progressStats}>
                <View style={styles.progressStatItem}>
                  <Text style={[styles.progressStatValue, { color: '#10b981' }]}>{checkinProgress.completed}</Text>
                  <Text style={styles.progressStatLabel}>已完成</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                  <Text style={[styles.progressStatValue, { color: '#ef4444' }]}>{checkinProgress.missed}</Text>
                  <Text style={styles.progressStatLabel}>已错过</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                  <Text style={styles.progressStatValue}>{checkinProgress.pending}</Text>
                  <Text style={styles.progressStatLabel}>待完成</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${(checkinProgress.completed / checkinProgress.total) * 100}%` }]} />
              </View>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardText}>已获得: {checkinProgress.earnedReward}</Text>
                {checkinProgress.lostReward > 0 && (
                  <Text style={[styles.rewardText, { color: '#ef4444' }]}>已损失: {checkinProgress.lostReward}</Text>
                )}
              </View>
            </View>
          )}

          {/* Referee Code */}
          <View style={styles.refereeCodeCard}>
            <Text style={styles.sectionTitle}>监督码</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.codeContainer} activeOpacity={0.8}>
              <Text style={styles.codeText}>{prediction.referee_code}</Text>
              <Ionicons name="copy-outline" size={22} color="#a855f7" />
            </TouchableOpacity>
            <Text style={styles.codeHint}>分享给朋友邀请他们成为监督人</Text>
          </View>

          {/* Referees Count (hidden details) */}
          <View style={styles.refereeCountCard}>
            <Ionicons name="eye-outline" size={20} color="#64748b" />
            <Text style={styles.refereeCountText}>
              {referees.length > 0 ? `${referees.length} 位监督人正在关注` : '还没有监督人'}
            </Text>
          </View>

          {/* Check-in Input */}
          {prediction.status === 'active' && (
            <View style={styles.checkinSection}>
              <Text style={styles.sectionTitle}>打卡 ({checkins.length})</Text>
              <View style={styles.checkinInput}>
                <TextInput
                  value={checkInContent}
                  onChangeText={setCheckInContent}
                  placeholder="分享你的进展（至少10字）..."
                  placeholderTextColor="#52525b"
                  style={styles.textInput}
                  multiline
                  maxLength={500}
                  editable={!isSubmitting}
                />
                {selectedImage && (
                  <ImagePreview
                    uri={selectedImage}
                    onRemove={handleRemoveImage}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    size="large"
                  />
                )}
                <View style={styles.checkinActions}>
                  <TouchableOpacity onPress={() => setShowImagePicker(true)} disabled={isSubmitting} style={styles.photoButton}>
                    <Ionicons name={selectedImage ? 'image' : 'image-outline'} size={24} color={selectedImage ? '#a855f7' : '#71717a'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCheckIn}
                    disabled={isSubmitting || checkInContent.trim().length < 10}
                    style={[styles.submitButton, (checkInContent.trim().length >= 10 && !isSubmitting) && styles.submitButtonActive]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>发布</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Checkins List */}
          {checkins.length > 0 && (
            <View style={styles.checkinsList}>
              {checkins.map((checkin) => (
                <View key={checkin.id} style={styles.checkinCard}>
                  <Text style={styles.checkinContent}>{checkin.content}</Text>
                  {checkin.image_url && (
                    <CheckInImage uri={checkin.image_url} onPress={() => setFullScreenImage(checkin.image_url!)} />
                  )}
                  <Text style={styles.checkinDate}>{formatDate(checkin.created_at)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Button */}
          {canTriggerJudging && (
            <TouchableOpacity onPress={handleTriggerJudging} style={styles.actionButton}>
              <LinearGradient colors={['#c084fc', '#a855f7', '#9333ea']} style={styles.actionButtonGradient}>
                <Text style={styles.actionButtonText}>请求评审</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {prediction.status === 'active' && referees.length === 0 && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.warningText}>你需要至少1个监督人才能请求评审</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onPickFromLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />

      {fullScreenImage && (
        <FullScreenImage visible={!!fullScreenImage} uri={fullScreenImage} onClose={() => setFullScreenImage(null)} />
      )}
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
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 18, marginTop: 16 },
  errorButton: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorButtonText: { color: '#fff', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  backButton: { padding: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  statusSection: { marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 13, fontWeight: '600' },
  titleSection: { marginBottom: 16 },
  predictionTitle: { fontSize: 26, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.3 },
  predictionDesc: { fontSize: 15, color: '#64748b', marginTop: 8, lineHeight: 22 },
  basicInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  basicInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  basicInfoText: { color: '#94a3b8', fontSize: 13 },
  basicInfoDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 10 },
  countdownCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
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
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  rewardRow: { flexDirection: 'row', gap: 16 },
  rewardText: { fontSize: 13, color: '#10b981' },
  refereeCodeCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  codeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 },
  codeText: { color: '#f8fafc', fontSize: 24, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 4 },
  codeHint: { color: '#52525b', fontSize: 12, marginTop: 8 },
  refereeCountCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  refereeCountText: { color: '#64748b', fontSize: 14 },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyText: { color: '#52525b', fontSize: 14, marginTop: 12 },
  checkinSection: { marginBottom: 16 },
  checkinInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  textInput: { color: '#f8fafc', fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  checkinActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoButton: { padding: 8 },
  submitButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  submitButtonActive: { backgroundColor: '#a855f7' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  checkinsList: { marginBottom: 16 },
  checkinCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkinContent: { color: '#f8fafc', fontSize: 15, lineHeight: 22 },
  checkinDate: { color: '#52525b', fontSize: 12, marginTop: 8 },
  actionButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  actionButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  warningCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 16, gap: 10 },
  warningText: { flex: 1, color: '#f59e0b', fontSize: 14 },
});
