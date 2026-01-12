import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserPredictions } from '@/services/prediction.service';
import { useUserStore } from '@/stores/useUserStore';
import { useRefresh } from '@/hooks/usePolling';
import { formatCredits, formatDate } from '@/lib/utils';
import type { Prediction } from '@/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const data = await getUserPredictions(user.id);
    setPredictions(data);
  }, [user]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  const statusConfig = {
    ACTIVE: { color: 'bg-emerald-500', textColor: 'text-emerald-500', label: 'Active', icon: 'flag' },
    JUDGING: { color: 'bg-amber-500', textColor: 'text-amber-500', label: 'Judging', icon: 'time' },
    SUCCESS: { color: 'bg-emerald-500', textColor: 'text-emerald-500', label: 'Success', icon: 'checkmark-circle' },
    FAILED: { color: 'bg-red-500', textColor: 'text-red-500', label: 'Failed', icon: 'close-circle' },
    CANCELLED: { color: 'bg-zinc-500', textColor: 'text-zinc-500', label: 'Cancelled', icon: 'ban' },
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </SafeAreaView>
    );
  }

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
        <View className="flex-row items-center px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Prediction History</Text>
        </View>

        {/* Stats */}
        <View className="flex-row px-6 mb-6 gap-4">
          <View className="flex-1 bg-zinc-900 rounded-2xl p-4">
            <Text className="text-zinc-500 text-sm">Total</Text>
            <Text className="text-white text-2xl font-bold">{predictions.length}</Text>
          </View>
          <View className="flex-1 bg-zinc-900 rounded-2xl p-4">
            <Text className="text-zinc-500 text-sm">Success</Text>
            <Text className="text-emerald-500 text-2xl font-bold">
              {predictions.filter((p) => p.status === 'SUCCESS').length}
            </Text>
          </View>
          <View className="flex-1 bg-zinc-900 rounded-2xl p-4">
            <Text className="text-zinc-500 text-sm">Failed</Text>
            <Text className="text-red-500 text-2xl font-bold">
              {predictions.filter((p) => p.status === 'FAILED').length}
            </Text>
          </View>
        </View>

        {/* Predictions List */}
        <View className="px-6">
          {predictions.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="flag-outline" size={48} color="#52525B" />
              <Text className="text-zinc-500 mt-4">No predictions yet</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/prediction')}
                className="mt-4 bg-violet-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Create Your First</Text>
              </TouchableOpacity>
            </View>
          ) : (
            predictions.map((prediction) => {
              const config = statusConfig[prediction.status];
              return (
                <TouchableOpacity
                  key={prediction.id}
                  onPress={() => router.push(`/(screens)/prediction/${prediction.id}`)}
                  className="bg-zinc-900 rounded-2xl p-4 mb-3"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-2 ${config.color}`} />
                      <Text className={`text-sm ${config.textColor}`}>{config.label}</Text>
                      {prediction.is_recovery && (
                        <View className="ml-2 px-2 py-0.5 bg-amber-500/20 rounded">
                          <Text className="text-amber-500 text-xs">Recovery</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525B" />
                  </View>

                  <Text className="text-white text-lg font-semibold mb-2" numberOfLines={1}>
                    {prediction.title}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-zinc-500 text-sm">
                      {formatDate(prediction.created_at)}
                    </Text>
                    <Text className="text-violet-400 font-semibold">
                      {prediction.is_recovery ? 'Recovery' : `${formatCredits(prediction.stake)} credits`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

