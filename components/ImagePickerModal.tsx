import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPickFromLibrary: () => void;
  onTakePhoto: () => void;
}

export function ImagePickerModal({
  visible,
  onClose,
  onPickFromLibrary,
  onTakePhoto,
}: ImagePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-zinc-900 rounded-t-3xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mb-6" />
          
          <Text className="text-white text-lg font-semibold mb-4">
            Add Photo
          </Text>

          <TouchableOpacity
            onPress={onTakePhoto}
            className="flex-row items-center py-4 border-b border-zinc-800"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-full bg-violet-600/20 items-center justify-center mr-4">
              <Ionicons name="camera" size={24} color="#A78BFA" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium">Take Photo</Text>
              <Text className="text-zinc-500 text-sm">Use camera to take a new photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#52525B" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPickFromLibrary}
            className="flex-row items-center py-4"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-full bg-violet-600/20 items-center justify-center mr-4">
              <Ionicons name="images" size={24} color="#A78BFA" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium">Choose from Library</Text>
              <Text className="text-zinc-500 text-sm">Select an existing photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#52525B" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 py-4 bg-zinc-800 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}





