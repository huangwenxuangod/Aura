import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

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
          <Text className="text-white text-xl font-bold ml-4">Terms of Service</Text>
        </View>

        <View className="px-6">
          <Text className="text-zinc-400 text-sm mb-6">
            Last updated: January 2026
          </Text>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">1. Acceptance of Terms</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              By accessing or using Aura, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">2. Credits System</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              Credits purchased within Aura are non-refundable and cannot be converted back to cash or any other currency. Credits can only be used for predictions within the application.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">3. Prediction Rules</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              • Users can only have one active prediction at a time.{'\n'}
              • Failed predictions result in stake entering recovery mode.{'\n'}
              • Recovery requires 2 consecutive successful predictions.{'\n'}
              • Failure during recovery results in stake forfeiture.{'\n'}
              • Predictions can be cancelled within 5 minutes of creation.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">4. Referee System</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              • At least one referee is required for judgment.{'\n'}
              • Referees vote on prediction success (Yes/No).{'\n'}
              • Majority vote determines outcome.{'\n'}
              • No response within 24 hours counts as "Yes".{'\n'}
              • Users cannot be referees for their own predictions.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">5. Liability</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              Aura is provided "as is" without warranties of any kind. We are not responsible for any losses incurred through the use of our service.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">6. Privacy</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">7. Contact</Text>
            <Text className="text-zinc-400 text-sm leading-6">
              If you have any questions about these Terms, please contact us at support@aura.app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

