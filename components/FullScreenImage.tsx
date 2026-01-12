import { View, Image, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullScreenImageProps {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

export function FullScreenImage({ visible, uri, onClose }: FullScreenImageProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar style="light" />
      <View className="flex-1 bg-black">
        {/* 关闭按钮 */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* 图片 */}
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={onClose}
        >
          <Image
            source={{ uri }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT * 0.8,
            }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </Modal>
  );
}





