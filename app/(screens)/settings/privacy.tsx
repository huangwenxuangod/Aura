import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacySettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Privacy & Security</Text>
        </View>

        <View className="px-6">
          {/* Account Security */}
          <Text className="text-zinc-500 text-sm mb-4">Account Security</Text>
          <View className="bg-zinc-900 rounded-2xl overflow-hidden mb-6">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-zinc-800">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Ionicons name="key" size={20} color="#A78BFA" />
                </View>
                <Text className="text-white">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Ionicons name="phone-portrait" size={20} color="#A78BFA" />
                </View>
                <Text className="text-white">Two-Factor Authentication</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
          </View>

          {/* Data & Privacy */}
          <Text className="text-zinc-500 text-sm mb-4">Data & Privacy</Text>
          <View className="bg-zinc-900 rounded-2xl overflow-hidden mb-6">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-zinc-800">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Ionicons name="download" size={20} color="#A78BFA" />
                </View>
                <Text className="text-white">Download My Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center mr-3">
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </View>
                <Text className="text-red-500">Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

