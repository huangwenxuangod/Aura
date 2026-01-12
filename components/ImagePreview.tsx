import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImagePreviewProps {
  uri: string;
  onRemove?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  size?: 'small' | 'medium' | 'large';
}

export function ImagePreview({
  uri,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  size = 'medium',
}: ImagePreviewProps) {
  const sizeStyles = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: '100%' as const, height: 200 },
  };

  const dimensions = sizeStyles[size];

  return (
    <View
      className="relative rounded-xl overflow-hidden bg-zinc-800"
      style={dimensions}
    >
      <Image
        source={{ uri }}
        className="w-full h-full"
        resizeMode="cover"
      />

      {/* 上传中遮罩 */}
      {isUploading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center">
          <ActivityIndicator size="small" color="#A78BFA" />
          <Text className="text-white text-xs mt-2">{uploadProgress}%</Text>
        </View>
      )}

      {/* 删除按钮 */}
      {onRemove && !isUploading && (
        <TouchableOpacity
          onPress={onRemove}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface CheckInImageProps {
  uri: string;
  onPress?: () => void;
}

export function CheckInImage({ uri, onPress }: CheckInImageProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="mt-3 rounded-xl overflow-hidden"
    >
      <Image
        source={{ uri }}
        className="w-full h-48"
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}





