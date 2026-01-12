import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How do predictions work?',
      answer: 'Create a prediction with a deadline and stake credits. Share your referee code with friends who will verify your success. If you succeed, you get your credits back. If you fail, you enter recovery mode.',
    },
    {
      question: 'What is Recovery Mode?',
      answer: 'If your prediction fails, your stake enters recovery mode. You need 2 consecutive successful predictions to recover your original stake. If you fail during recovery, the stake is forfeited.',
    },
    {
      question: 'How do referees work?',
      answer: 'Referees are friends or contacts who verify whether you achieved your prediction. Share your referee code with them. They vote Yes or No when you request judgment.',
    },
    {
      question: 'Can I withdraw credits?',
      answer: 'No, credits cannot be withdrawn or converted back to cash. They can only be used for predictions within the app.',
    },
    {
      question: 'What happens if referees don\'t vote?',
      answer: 'If a referee doesn\'t vote within 24 hours of judgment being requested, their vote counts as "Yes" by default.',
    },
  ];

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
          <Text className="text-white text-xl font-bold ml-4">Help & Support</Text>
        </View>

        <View className="px-6">
          {/* Contact */}
          <Text className="text-zinc-500 text-sm mb-4">Contact Us</Text>
          <View className="bg-zinc-900 rounded-2xl overflow-hidden mb-6">
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:support@aura.app')}
              className="flex-row items-center justify-between p-4 border-b border-zinc-800"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Ionicons name="mail" size={20} color="#A78BFA" />
                </View>
                <View>
                  <Text className="text-white">Email Support</Text>
                  <Text className="text-zinc-500 text-sm">support@aura.app</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://twitter.com/auraapp')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center mr-3">
                  <Ionicons name="logo-twitter" size={20} color="#A78BFA" />
                </View>
                <View>
                  <Text className="text-white">Twitter</Text>
                  <Text className="text-zinc-500 text-sm">@auraapp</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
          </View>

          {/* FAQs */}
          <Text className="text-zinc-500 text-sm mb-4">Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} className="bg-zinc-900 rounded-2xl p-4 mb-3">
              <Text className="text-white font-semibold mb-2">{faq.question}</Text>
              <Text className="text-zinc-400 text-sm leading-5">{faq.answer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

