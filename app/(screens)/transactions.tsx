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
import { getTransactions } from '@/services/payment.service';
import { useRefresh } from '@/hooks/usePolling';
import { formatCredits, formatDate } from '@/lib/utils';

type Transaction = {
  id: string;
  type: 'RECHARGE' | 'STAKE' | 'REFUND' | 'RECOVERY' | 'FORFEIT';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  description?: string;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const data = await getTransactions();
    setTransactions(data);
  }, []);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const { isRefreshing, onRefresh } = useRefresh(loadData);

  const typeConfig = {
    RECHARGE: { icon: 'add-circle', color: 'text-emerald-500', prefix: '+' },
    STAKE: { icon: 'flag', color: 'text-amber-500', prefix: '-' },
    REFUND: { icon: 'arrow-undo', color: 'text-emerald-500', prefix: '+' },
    RECOVERY: { icon: 'refresh', color: 'text-emerald-500', prefix: '+' },
    FORFEIT: { icon: 'close-circle', color: 'text-red-500', prefix: '-' },
  };

  const typeLabels = {
    RECHARGE: 'Recharge',
    STAKE: 'Stake',
    REFUND: 'Refund',
    RECOVERY: 'Recovery',
    FORFEIT: 'Forfeit',
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
          <Text className="text-white text-xl font-bold ml-4">Transaction History</Text>
        </View>

        {/* Transactions List */}
        <View className="px-6">
          {transactions.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="receipt-outline" size={48} color="#52525B" />
              <Text className="text-zinc-500 mt-4">No transactions yet</Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const config = typeConfig[transaction.type];
              return (
                <View
                  key={transaction.id}
                  className="bg-zinc-900 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                      <Ionicons
                        name={config.icon as any}
                        size={20}
                        color={config.color.includes('emerald') ? '#10B981' : config.color.includes('amber') ? '#F59E0B' : '#EF4444'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">
                        {typeLabels[transaction.type]}
                      </Text>
                      <Text className="text-zinc-500 text-sm">
                        {formatDate(transaction.created_at)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-lg font-bold ${config.color}`}>
                        {config.prefix}{formatCredits(transaction.amount)}
                      </Text>
                      <Text className={`text-xs ${
                        transaction.status === 'COMPLETED' ? 'text-emerald-500' :
                        transaction.status === 'FAILED' ? 'text-red-500' : 'text-zinc-500'
                      }`}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

