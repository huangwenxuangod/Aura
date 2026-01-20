import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { useCountdown } from '@/hooks/useCountdown';
import {
  getPredictionDetail,
  cancelPrediction,
  createCheckin,
} from '@/services/prediction.service';
import {
  pickImageFromLibrary,
  takePhoto,
  uploadCheckInImage,
  UploadProgress,
} from '@/services/image.service';
import { formatDate } from '@/lib/utils';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { ImagePreview, CheckInImage } from '@/components/ImagePreview';
import { FullScreenImage } from '@/components/FullScreenImage';
import type { PredictionDetail, Checkin } from '@/types';
import { supabase } from '@/lib/supabase';

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { fetchUser } = useUserStore();

  // 安全返回：如果无法 back 就跳转到首页
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInContent, setCheckInContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // 取消预测（未到时间返还25%）
  const handleCancel = () => {
    if (!prediction) return;
    
    const refundAmount = Math.floor(prediction.total_stake * 0.25);
    const lossAmount = prediction.total_stake - refundAmount;
    
    Alert.alert(
      '取消预测',
      `确定要取消这个预测吗？\n\n• 你将返还 ${refundAmount} 积分 (25%)\n• 损失 ${lossAmount} 积分 (75%)`,
      [
        { text: '再想想', style: 'cancel' },
        {
          text: '确定取消',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              // 调用 RPC 取消并退款 25%
              const { error } = await supabase.rpc('cancel_prediction_with_penalty', {
                p_prediction_id: id,
              });
              
              if (error) throw error;
              
              await fetchUser();
              Toast.show({ 
                type: 'success', 
                text1: '预测已取消',
                text2: `已返还 ${refundAmount} 积分`
              });
              handleGoBack();
            } catch (error: any) {
              Toast.show({ type: 'error', text1: error.message });
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
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
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
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
          <TouchableOpacity onPress={handleGoBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>返回</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const checkins = prediction.checkins || [];
  const statusLabel = prediction.status === 'active' ? '进行中' : 
                      prediction.status === 'judging' ? '评审中' : 
                      prediction.final_result === 'success' ? '成功' : '失败';
  const statusColor = prediction.status === 'active' ? '#10b981' : 
                      prediction.status === 'judging' ? '#f59e0b' : 
                      prediction.final_result === 'success' ? '#10b981' : '#ef4444';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#f8fafc" />
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{prediction.title}</Text>
            {prediction.description && (
              <Text style={styles.description}>{prediction.description}</Text>
            )}
            <View style={styles.metaRow}>
              <Ionicons name="diamond" size={14} color="#a855f7" />
              <Text style={styles.metaText}>{prediction.total_stake} 积分</Text>
              <View style={styles.metaDot} />
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{formatDate(prediction.deadline)}</Text>
            </View>
          </View>

          {/* Countdown */}
          {prediction.status === 'active' && (
            <View style={styles.countdownCard}>
              <Text style={styles.countdownLabel}>
                {countdown.isExpired ? '已到截止时间' : '剩余时间'}
              </Text>
              <Text style={[styles.countdownValue, countdown.isExpired && styles.countdownExpired]}>
                {countdown.formatted}
              </Text>
            </View>
          )}

          {/* Check-in Input */}
          {prediction.status === 'active' && (
            <View style={styles.checkinSection}>
              <Text style={styles.sectionTitle}>打卡</Text>
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
                    <Ionicons name={selectedImage ? 'image' : 'image-outline'} size={24} color={selectedImage ? '#a855f7' : '#64748b'} />
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
          <View style={styles.checkinsSection}>
            <Text style={styles.sectionTitle}>打卡记录 ({checkins.length})</Text>
            {checkins.length === 0 ? (
              <View style={styles.emptyCheckins}>
                <Ionicons name="document-text-outline" size={32} color="#3f3f46" />
                <Text style={styles.emptyText}>暂无打卡记录</Text>
              </View>
            ) : (
              checkins.map((checkin) => (
                <View key={checkin.id} style={styles.checkinCard}>
                  <Text style={styles.checkinContent}>{checkin.content}</Text>
                  {checkin.image_url && (
                    <CheckInImage uri={checkin.image_url} onPress={() => setFullScreenImage(checkin.image_url!)} />
                  )}
                  <Text style={styles.checkinDate}>{formatDate(checkin.created_at)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Cancel Button */}
          {prediction.status === 'active' && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isCancelling}
              style={styles.cancelButton}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <Text style={styles.cancelButtonText}>取消预测（返还25%）</Text>
                </>
              )}
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748b', marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#f8fafc', fontSize: 18, marginTop: 16 },
  errorButton: { marginTop: 24, backgroundColor: '#1e1e24', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  errorButtonText: { color: '#f8fafc', fontSize: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },

  // Title
  titleSection: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  description: { fontSize: 15, color: '#94a3b8', lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#94a3b8' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#3f3f46', marginHorizontal: 6 },

  // Countdown
  countdownCard: { backgroundColor: '#141419', borderRadius: 12, padding: 16, marginBottom: 20 },
  countdownLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  countdownValue: { fontSize: 28, fontWeight: '700', color: '#f8fafc' },
  countdownExpired: { color: '#ef4444' },

  // Checkin Input
  checkinSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  checkinInput: { backgroundColor: '#141419', borderRadius: 12, padding: 16 },
  textInput: { color: '#f8fafc', fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  checkinActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoButton: { padding: 8 },
  submitButton: { backgroundColor: '#27272a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  submitButtonActive: { backgroundColor: '#a855f7' },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Checkins List
  checkinsSection: { marginBottom: 20 },
  emptyCheckins: { backgroundColor: '#141419', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#52525b', fontSize: 14, marginTop: 12 },
  checkinCard: { backgroundColor: '#141419', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkinContent: { color: '#f8fafc', fontSize: 15, lineHeight: 22 },
  checkinDate: { color: '#52525b', fontSize: 12, marginTop: 8 },

  // Cancel Button
  cancelButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12, 
    paddingVertical: 16, 
    gap: 8,
    marginTop: 20,
  },
  cancelButtonText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
