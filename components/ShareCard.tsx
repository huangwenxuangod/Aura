import React from 'react';
import { View, Text } from 'react-native';
import { formatCredit } from '@/lib/utils';

interface ShareCardProps {
  type: 'prediction_created' | 'prediction_success' | 'prediction_failed' | 'recovery_progress';
  title: string;
  stake: number;
  refereeCode?: string;
  deadline?: string;
  streak?: number;
  recoveryProgress?: number;
}

export function ShareCard({
  type,
  title,
  stake,
  refereeCode,
  deadline,
  streak,
  recoveryProgress,
}: ShareCardProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'prediction_created':
        return {
          icon: '🎯',
          label: 'New Prediction',
          color: 'bg-violet-500',
          textColor: 'text-violet-500',
        };
      case 'prediction_success':
        return {
          icon: '✅',
          label: 'Prediction Completed',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500',
        };
      case 'prediction_failed':
        return {
          icon: '❌',
          label: 'Prediction Failed',
          color: 'bg-red-500',
          textColor: 'text-red-500',
        };
      case 'recovery_progress':
        return {
          icon: '🔄',
          label: 'Recovery Progress',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
        };
    }
  };

  const config = getTypeConfig();

  const formatDeadline = () => {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="w-[350px] bg-zinc-900 rounded-3xl overflow-hidden">
      {/* Header */}
      <View className={`${config.color} px-6 py-4`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">{config.icon}</Text>
            <Text className="text-white text-lg font-bold">{config.label}</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-sm font-medium">Aura</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="px-6 py-5">
        {/* Title */}
        <Text className="text-white text-xl font-bold mb-4" numberOfLines={2}>
          "{title}"
        </Text>

        {/* Info Grid */}
        <View className="flex-row flex-wrap mb-4">
          <View className="w-1/2 mb-3">
            <Text className="text-zinc-500 text-xs mb-1">Stake</Text>
            <Text className="text-white text-lg font-semibold">
              {formatCredit(stake)}
            </Text>
          </View>
          
          {deadline && (
            <View className="w-1/2 mb-3">
              <Text className="text-zinc-500 text-xs mb-1">Deadline</Text>
              <Text className="text-white text-lg font-semibold">
                {formatDeadline()}
              </Text>
            </View>
          )}

          {streak !== undefined && (
            <View className="w-1/2 mb-3">
              <Text className="text-zinc-500 text-xs mb-1">Streak</Text>
              <Text className="text-amber-500 text-lg font-semibold">
                🔥 {streak}
              </Text>
            </View>
          )}

          {recoveryProgress !== undefined && (
            <View className="w-1/2 mb-3">
              <Text className="text-zinc-500 text-xs mb-1">Progress</Text>
              <Text className="text-amber-500 text-lg font-semibold">
                {recoveryProgress}/2
              </Text>
            </View>
          )}
        </View>

        {/* Referee Code */}
        {refereeCode && type === 'prediction_created' && (
          <View className="bg-zinc-800 rounded-xl p-4 mb-4">
            <Text className="text-zinc-400 text-xs mb-2">Referee Code</Text>
            <Text className="text-white text-2xl font-mono font-bold tracking-widest text-center">
              {refereeCode}
            </Text>
            <Text className="text-zinc-500 text-xs text-center mt-2">
              Enter this code to supervise my prediction
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="px-6 pb-5">
        <View className="flex-row items-center justify-center bg-zinc-800 rounded-xl py-3">
          <Text className="text-zinc-400 text-sm">
            Predict your behavior • 
          </Text>
          <Text className="text-violet-500 text-sm font-semibold ml-1">
            aura.app
          </Text>
        </View>
      </View>
    </View>
  );
}

