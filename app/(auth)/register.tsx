import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { signUpWithEmail } from '@/services/auth.service';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Please fill in all required fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password must be at least 6 characters',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, displayName || undefined);
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Welcome to Aura',
      });
      router.replace('/');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center py-12">
            {/* Header */}
            <View className="items-center mb-10">
              <Text className="text-white text-3xl font-bold">
                Create Account
              </Text>
              <Text className="text-zinc-500 text-base mt-2 text-center">
                Start predicting and achieving your goals
              </Text>
            </View>

            {/* Display Name Input */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2 ml-1">
                Display Name{' '}
                <Text className="text-zinc-600">(optional)</Text>
              </Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800">
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#71717A"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="How should we call you?"
                  placeholderTextColor="#52525B"
                  autoCapitalize="words"
                  className="flex-1 text-white py-4 px-3 text-base"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2 ml-1">
                Email <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800">
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#71717A"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#52525B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-white py-4 px-3 text-base"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2 ml-1">
                Password <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#71717A"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#52525B"
                  secureTextEntry={!showPassword}
                  className="flex-1 text-white py-4 px-3 text-base"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2 ml-1">
                Confirm Password <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#71717A"
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#52525B"
                  secureTextEntry={!showPassword}
                  className="flex-1 text-white py-4 px-3 text-base"
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-violet-600 rounded-xl py-4 items-center"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-zinc-600 text-xs text-center mt-4 px-4">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </Text>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-zinc-500">Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-violet-500 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
