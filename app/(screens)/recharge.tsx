import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUserStore } from '@/stores/useUserStore';
import { createStripeCheckout, addTestCredits, isStripeAvailable } from '@/services/payment.service';
import { formatCredits } from '@/lib/utils';
import { RECHARGE_TIERS } from '@/lib/constants';

export default function RechargeScreen() {
  const router = useRouter();
  const { user, fetchUser } = useUserStore();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);

  useEffect(() => {
    isStripeAvailable().then(setStripeAvailable);
  }, []);

  const handleRecharge = async () => {
    if (selectedTier === null) {
      Toast.show({ type: 'error', text1: 'Please select a package' });
      return;
    }

    const tier = RECHARGE_TIERS[selectedTier];
    setIsLoading(true);

    try {
      await createStripeCheckout(tier.price, tier.credits);
      await fetchUser();
      Toast.show({
        type: 'success',
        text1: 'Recharge successful!',
        text2: `${formatCredits(tier.credits)} credits added`,
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Recharge failed',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestRecharge = () => {
    if (selectedTier === null) {
      Toast.show({ type: 'error', text1: 'Please select a package' });
      return;
    }

    const tier = RECHARGE_TIERS[selectedTier];

    Alert.alert(
      'Add Test Credits',
      `This will add ${formatCredits(tier.credits)} test credits to your account.\n\nThis is for development testing only.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Credits',
          onPress: async () => {
            setIsLoading(true);
            try {
              await addTestCredits(tier.credits);
              await fetchUser();
              Toast.show({
                type: 'success',
                text1: 'Test credits added!',
                text2: `${formatCredits(tier.credits)} credits`,
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Failed to add credits',
                text2: error.message,
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Recharge Credits</Text>
        </View>

        {/* Current Balance */}
        <View className="mx-6 p-6 bg-zinc-900 rounded-3xl border border-zinc-800 mb-6">
          <Text className="text-zinc-500 text-sm mb-2">Current Balance</Text>
          <View className="flex-row items-baseline">
            <Text className="text-white text-4xl font-bold">
              {formatCredits(user?.credits || 0)}
            </Text>
            <Text className="text-zinc-500 text-lg ml-2">credits</Text>
          </View>
        </View>

        {/* Recharge Tiers */}
        <View className="px-6 mb-6">
          <Text className="text-zinc-400 text-sm mb-4">Select Package</Text>
          
          {RECHARGE_TIERS.map((tier, index) => {
            const isSelected = selectedTier === index;
            const bonusPercent = tier.bonus > 0 
              ? Math.round((tier.bonus / (tier.credits - tier.bonus)) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedTier(index)}
                className={`p-4 rounded-2xl mb-3 border-2 ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-500'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white text-xl font-bold">
                        ${tier.price}
                      </Text>
                      {bonusPercent > 0 && (
                        <View className="ml-2 px-2 py-0.5 bg-emerald-500/20 rounded">
                          <Text className="text-emerald-500 text-xs font-semibold">
                            +{bonusPercent}% Bonus
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-zinc-500 mt-1">
                      {formatCredits(tier.credits)} credits
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'
                  }`}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View className="mx-6 p-4 bg-zinc-900/50 rounded-2xl mb-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#71717A" />
            <View className="flex-1 ml-3">
              <Text className="text-zinc-400 text-sm">
                Credits cannot be withdrawn or converted back to cash. They can only be used for predictions within the app.
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View className="px-6 mb-6">
          <Text className="text-zinc-400 text-sm mb-3">Payment Method</Text>
          <View className={`bg-zinc-900 rounded-2xl p-4 flex-row items-center ${!stripeAvailable ? 'opacity-50' : ''}`}>
            <View className="w-10 h-10 rounded-lg bg-white items-center justify-center mr-3">
              <Text className="text-lg font-bold text-black">S</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">Stripe</Text>
              <Text className="text-zinc-500 text-sm">
                {stripeAvailable ? 'Credit/Debit Card' : 'Requires Dev Build'}
              </Text>
            </View>
            {stripeAvailable && (
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
            )}
          </View>
        </View>

        {/* Recharge Button */}
        <View className="px-6">
          {stripeAvailable ? (
            <TouchableOpacity
              onPress={handleRecharge}
              disabled={isLoading || selectedTier === null}
              className={`py-4 rounded-xl items-center ${
                selectedTier !== null ? 'bg-violet-600' : 'bg-zinc-700'
              }`}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  {selectedTier !== null
                    ? `Pay $${RECHARGE_TIERS[selectedTier].price}`
                    : 'Select a Package'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* Expo Go Test Mode */}
              <View className="bg-amber-500/10 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="flask" size={20} color="#F59E0B" />
                  <Text className="text-amber-500 font-semibold ml-2">
                    Expo Go Test Mode
                  </Text>
                </View>
                <Text className="text-zinc-400 text-sm">
                  Stripe payments require a Development Build. Use the button below to add test credits for development.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleTestRecharge}
                disabled={isLoading || selectedTier === null}
                className={`py-4 rounded-xl items-center ${
                  selectedTier !== null ? 'bg-amber-600' : 'bg-zinc-700'
                }`}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {selectedTier !== null
                      ? `Add ${formatCredits(RECHARGE_TIERS[selectedTier].credits)} Test Credits`
                      : 'Select a Package'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
