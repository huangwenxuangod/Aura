import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    predictionReminders: true,
    judgingRequests: true,
    voteResults: true,
    rechargeConfirmations: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-4 pb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Notifications</Text>
      </View>

      <View className="px-6">
        <Text className="text-zinc-500 text-sm mb-4">
          Manage how you receive notifications
        </Text>

        {/* Notification Settings */}
        <View className="bg-zinc-900 rounded-2xl overflow-hidden">
          <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <View className="flex-1 mr-4">
              <Text className="text-white font-semibold">Prediction Reminders</Text>
              <Text className="text-zinc-500 text-sm mt-1">
                Get reminded before your prediction deadline
              </Text>
            </View>
            <Switch
              value={settings.predictionReminders}
              onValueChange={() => toggleSetting('predictionReminders')}
              trackColor={{ false: '#27272A', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <View className="flex-1 mr-4">
              <Text className="text-white font-semibold">Judging Requests</Text>
              <Text className="text-zinc-500 text-sm mt-1">
                Notify when someone requests your judgment
              </Text>
            </View>
            <Switch
              value={settings.judgingRequests}
              onValueChange={() => toggleSetting('judgingRequests')}
              trackColor={{ false: '#27272A', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <View className="flex-1 mr-4">
              <Text className="text-white font-semibold">Vote Results</Text>
              <Text className="text-zinc-500 text-sm mt-1">
                Get notified when voting is complete
              </Text>
            </View>
            <Switch
              value={settings.voteResults}
              onValueChange={() => toggleSetting('voteResults')}
              trackColor={{ false: '#27272A', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1 mr-4">
              <Text className="text-white font-semibold">Recharge Confirmations</Text>
              <Text className="text-zinc-500 text-sm mt-1">
                Confirm when credits are added
              </Text>
            </View>
            <Switch
              value={settings.rechargeConfirmations}
              onValueChange={() => toggleSetting('rechargeConfirmations')}
              trackColor={{ false: '#27272A', true: '#8B5CF6' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

