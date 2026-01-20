import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions } from '@/services/payment.service';
import { formatCredits, formatDate } from '@/lib/utils';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // 根据类型获取显示配置
  const getTypeConfig = (type: string, amount: number) => {
    const isPositive = amount > 0;
    
    const configs: Record<string, { label: string; color: string }> = {
      stake: { label: '押注', color: '#f59e0b' },
      purchase: { label: '充值', color: '#10b981' },
      checkin_reward: { label: '打卡奖励', color: '#10b981' },
      result_reward: { label: '结果奖励', color: '#10b981' },
      forfeit: { label: '损失', color: '#ef4444' },
    };

    return configs[type] || { 
      label: type, 
      color: isPositive ? '#10b981' : '#ef4444' 
    };
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#f8fafc" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>交易记录</Text>
          </View>

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#3f3f46" />
              <Text style={styles.emptyText}>暂无交易记录</Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const config = getTypeConfig(transaction.type, transaction.amount);
              const isPositive = transaction.amount > 0;
              
              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View>
                      <Text style={styles.transactionType}>{config.label}</Text>
                      {transaction.description && (
                        <Text style={styles.transactionDesc} numberOfLines={1}>
                          {transaction.description}
                        </Text>
                      )}
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: config.color }]}>
                      {isPositive ? '+' : ''}{transaction.amount}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#52525b',
    fontSize: 15,
    marginTop: 12,
  },
  transactionCard: {
    backgroundColor: '#141419',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  transactionDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 200,
  },
  transactionDate: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
});
