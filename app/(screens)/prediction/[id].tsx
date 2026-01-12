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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { useCountdown } from '@/hooks/useCountdown';
import { useRefresh } from '@/hooks/usePolling';
import {
  getPrediction,
  getReferees,
  getCheckIns,
  triggerJudging,
  cancelPrediction,
  createCheckIn,
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
import type { Prediction, Referee, CheckIn } from '@/types';

export default function PredictionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchCurrentPrediction, fetchUser } = useUserStore();

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
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
    
    const [predictionData, refereesData, checkInsData] = await Promise.all([
      getPrediction(id),
      getReferees(id),
      getCheckIns(id),
    ]);

    setPrediction(predictionData);
    setReferees(refereesData);
    setCheckIns(checkInsData);
  }, [id]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  const canCancel = prediction && prediction.status === 'ACTIVE' && 
    new Date().getTime() - new Date(prediction.created_at).getTime() < 5 * 60 * 1000;

  const canTriggerJudging = prediction && prediction.status === 'ACTIVE' && referees.length > 0;

  const handleTriggerJudging = () => {
    Alert.alert(
      'Request Judgment',
      'Are you sure you want to request judgment from your referees? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await triggerJudging(id!);
              await loadData();
              Toast.show({ type: 'success', text1: 'Judgment requested' });
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
      'Cancel Prediction',
      'Are you sure you want to cancel this prediction? Your stake will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelPrediction(id!);
              await Promise.all([fetchCurrentPrediction(), fetchUser()]);
              Toast.show({ type: 'success', text1: 'Prediction cancelled' });
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
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      Clipboard.setString(prediction?.referee_code || '');
      Toast.show({
        type: 'success',
        text1: 'Referee code copied!',
        text2: prediction?.referee_code,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to copy',
      });
    }
  };

  // 选择图片
  const handlePickFromLibrary = async () => {
    setShowImagePicker(false);
    try {
      const result = await pickImageFromLibrary();
      if (result) {
        setSelectedImage(result.uri);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  const handleTakePhoto = async () => {
    setShowImagePicker(false);
    try {
      const result = await takePhoto();
      if (result) {
        setSelectedImage(result.uri);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // 提交打卡
  const handleCheckIn = async () => {
    if (!checkInContent.trim() && !selectedImage) {
      Toast.show({ type: 'error', text1: 'Please enter content or add a photo' });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(!!selectedImage);
    setUploadProgress(0);

    try {
      let imageUrl: string | undefined;

      // 如果有图片，先上传
      if (selectedImage) {
        imageUrl = await uploadCheckInImage(
          id!,
          selectedImage,
          (progress: UploadProgress) => {
            setUploadProgress(progress.percentage);
          }
        );
      }

      // 创建打卡记录
      await createCheckIn(id!, checkInContent.trim() || undefined, imageUrl);
      
      // 清空输入
      setCheckInContent('');
      setSelectedImage(null);
      
      // 刷新数据
      await loadData();
      
      Toast.show({ type: 'success', text1: 'Check-in submitted!' });
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
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </SafeAreaView>
    );
  }

  if (!prediction) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Prediction not found</Text>
      </SafeAreaView>
    );
  }

  const statusColors = {
    ACTIVE: 'bg-emerald-500',
    JUDGING: 'bg-amber-500',
    SUCCESS: 'bg-emerald-500',
    FAILED: 'bg-red-500',
    CANCELLED: 'bg-zinc-500',
  };

  const statusLabels = {
    ACTIVE: 'Active',
    JUDGING: 'Awaiting Judgment',
    SUCCESS: 'Success',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#A78BFA"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row">
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center mr-2"
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {canCancel && (
              <TouchableOpacity
                onPress={handleCancel}
                className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status & Countdown */}
        <View className="px-6 py-4">
          <View className="flex-row items-center mb-4">
            <View className={`w-2 h-2 rounded-full mr-2 ${statusColors[prediction.status]}`} />
            <Text className="text-zinc-400">{statusLabels[prediction.status]}</Text>
            {prediction.is_recovery && (
              <View className="ml-2 px-2 py-0.5 bg-amber-500/20 rounded">
                <Text className="text-amber-500 text-xs">Recovery</Text>
              </View>
            )}
          </View>

          <Text className="text-white text-2xl font-bold mb-2">
            {prediction.title}
          </Text>

          {prediction.description && (
            <Text className="text-zinc-500 text-base mb-4">
              {prediction.description}
            </Text>
          )}

          {/* Countdown Card */}
          {prediction.status === 'ACTIVE' && (
            <View className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <Text className="text-zinc-500 text-sm mb-2">Time Remaining</Text>
              <Text className={`text-3xl font-bold ${countdown.isExpired ? 'text-red-500' : 'text-white'}`}>
                {countdown.formatted}
              </Text>
            </View>
          )}

          {/* Stake Info */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4">
              <Text className="text-zinc-500 text-sm mb-1">Stake</Text>
              <Text className="text-violet-400 text-xl font-bold">
                {prediction.is_recovery ? 'Recovery' : `${formatCredits(prediction.stake)} credits`}
              </Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4">
              <Text className="text-zinc-500 text-sm mb-1">Deadline</Text>
              <Text className="text-white text-lg font-semibold">
                {formatDate(prediction.deadline)}
              </Text>
            </View>
          </View>
        </View>

        {/* Referee Code */}
        <View className="px-6 mb-6">
          <Text className="text-zinc-400 text-sm mb-2">Referee Code</Text>
          <TouchableOpacity
            onPress={handleCopyCode}
            className="bg-zinc-900 rounded-2xl p-4 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <Text className="text-white text-2xl font-mono tracking-widest">
              {prediction.referee_code}
            </Text>
            <Ionicons name="copy-outline" size={24} color="#A78BFA" />
          </TouchableOpacity>
          <Text className="text-zinc-600 text-xs mt-2 ml-1">
            Share this code with friends to invite them as referees
          </Text>
        </View>

        {/* Referees */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-zinc-400 text-sm">Referees ({referees.length})</Text>
          </View>
          
          {referees.length === 0 ? (
            <View className="bg-zinc-900/50 rounded-2xl p-4 items-center">
              <Ionicons name="people-outline" size={32} color="#52525B" />
              <Text className="text-zinc-500 mt-2">No referees yet</Text>
              <Text className="text-zinc-600 text-sm mt-1">
                Share your referee code to invite friends
              </Text>
            </View>
          ) : (
            <View className="bg-zinc-900 rounded-2xl overflow-hidden">
              {referees.map((referee, index) => (
                <View
                  key={referee.id}
                  className={`flex-row items-center p-4 ${index > 0 ? 'border-t border-zinc-800' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-violet-600/30 items-center justify-center mr-3">
                    <Text className="text-violet-400 font-semibold">
                      {(referee as any).users?.display_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white">
                      {(referee as any).users?.display_name || 'Anonymous'}
                    </Text>
                  </View>
                  {prediction.status === 'JUDGING' && (
                    <View className={`px-3 py-1 rounded-full ${
                      referee.vote === 'YES' ? 'bg-emerald-500/20' :
                      referee.vote === 'NO' ? 'bg-red-500/20' : 'bg-zinc-800'
                    }`}>
                      <Text className={`text-sm ${
                        referee.vote === 'YES' ? 'text-emerald-500' :
                        referee.vote === 'NO' ? 'text-red-500' : 'text-zinc-500'
                      }`}>
                        {referee.vote || 'Pending'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Check-ins */}
        {prediction.status === 'ACTIVE' && (
          <View className="px-6 mb-6">
            <Text className="text-zinc-400 text-sm mb-3">Check-ins ({checkIns.length})</Text>
            
            {/* Check-in Input */}
            <View className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <TextInput
                value={checkInContent}
                onChangeText={setCheckInContent}
                placeholder="Share your progress..."
                placeholderTextColor="#52525B"
                className="text-white text-base mb-3"
                multiline
                maxLength={500}
                editable={!isSubmitting}
              />

              {/* 已选择的图片预览 */}
              {selectedImage && (
                <View className="mb-3">
                  <ImagePreview
                    uri={selectedImage}
                    onRemove={handleRemoveImage}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    size="large"
                  />
                </View>
              )}

              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  onPress={() => setShowImagePicker(true)}
                  className="flex-row items-center"
                  disabled={isSubmitting}
                >
                  <Ionicons 
                    name={selectedImage ? "image" : "image-outline"} 
                    size={24} 
                    color={selectedImage ? "#A78BFA" : "#71717A"} 
                  />
                  <Text className={`ml-2 ${selectedImage ? 'text-violet-400' : 'text-zinc-500'}`}>
                    {selectedImage ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCheckIn}
                  disabled={isSubmitting || (!checkInContent.trim() && !selectedImage)}
                  className={`px-4 py-2 rounded-xl ${
                    (checkInContent.trim() || selectedImage) && !isSubmitting
                      ? 'bg-violet-600' 
                      : 'bg-zinc-700'
                  }`}
                >
                  {isSubmitting ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#fff" />
                      <Text className="text-white font-semibold ml-2">
                        {isUploading ? `${uploadProgress}%` : 'Posting...'}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white font-semibold">Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Check-in List */}
            {checkIns.map((checkIn) => (
              <View key={checkIn.id} className="bg-zinc-900/50 rounded-2xl p-4 mb-2">
                {checkIn.content && (
                  <Text className="text-white">{checkIn.content}</Text>
                )}
                {checkIn.image_url && (
                  <CheckInImage
                    uri={checkIn.image_url}
                    onPress={() => setFullScreenImage(checkIn.image_url)}
                  />
                )}
                <Text className="text-zinc-600 text-xs mt-2">
                  {formatDate(checkIn.created_at)}
                </Text>
              </View>
            ))}

            {checkIns.length === 0 && (
              <View className="bg-zinc-900/30 rounded-2xl p-6 items-center">
                <Ionicons name="document-text-outline" size={32} color="#52525B" />
                <Text className="text-zinc-500 mt-2">No check-ins yet</Text>
                <Text className="text-zinc-600 text-sm mt-1">
                  Share your progress with photos and updates
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Completed Check-ins (for non-active predictions) */}
        {prediction.status !== 'ACTIVE' && checkIns.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-zinc-400 text-sm mb-3">Check-in History ({checkIns.length})</Text>
            {checkIns.map((checkIn) => (
              <View key={checkIn.id} className="bg-zinc-900/50 rounded-2xl p-4 mb-2">
                {checkIn.content && (
                  <Text className="text-white">{checkIn.content}</Text>
                )}
                {checkIn.image_url && (
                  <CheckInImage
                    uri={checkIn.image_url}
                    onPress={() => setFullScreenImage(checkIn.image_url)}
                  />
                )}
                <Text className="text-zinc-600 text-xs mt-2">
                  {formatDate(checkIn.created_at)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        {canTriggerJudging && (
          <View className="px-6">
            <TouchableOpacity
              onPress={handleTriggerJudging}
              className="bg-violet-600 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-lg">
                Request Judgment
              </Text>
            </TouchableOpacity>
            <Text className="text-zinc-600 text-xs text-center mt-2">
              Your referees will vote on whether you succeeded
            </Text>
          </View>
        )}

        {prediction.status === 'ACTIVE' && referees.length === 0 && (
          <View className="px-6">
            <View className="bg-amber-500/10 rounded-xl p-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text className="text-amber-500 ml-2 flex-1">
                  You need at least 1 referee to request judgment
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onPickFromLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />

      {/* Full Screen Image Viewer */}
      {fullScreenImage && (
        <FullScreenImage
          visible={!!fullScreenImage}
          uri={fullScreenImage}
          onClose={() => setFullScreenImage(null)}
        />
      )}
    </SafeAreaView>
  );
}
