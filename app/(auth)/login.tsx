import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { signInWithEmail, signInWithGoogle, isGoogleSignInAvailable } from '@/services/auth.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegionStore } from '@/stores/useRegionStore';
import { createTranslator } from '@/lib/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { region, config } = useRegionStore();
  const t = createTranslator(region);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const isChina = region === 'CN';

  useEffect(() => {
    if (!isChina) {
      isGoogleSignInAvailable().then(setGoogleAvailable);
    }
  }, [isChina]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: isChina ? '请填写所有字段' : 'Please fill in all fields',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isChina ? '登录失败' : 'Login failed',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleAvailable) {
      Toast.show({
        type: 'info',
        text1: 'Google Sign-In not available',
        text2: 'Please use Email login in Expo Go',
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Google login failed',
        text2: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleWeChatLogin = async () => {
    // 微信登录占位 - 需要微信 SDK
    Toast.show({
      type: 'info',
      text1: '微信登录',
      text2: '即将上线，请先使用邮箱登录',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo & Title */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-full bg-violet-600 items-center justify-center mb-4">
              <Text className="text-4xl">🎯</Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-tight">
              {config.brandName}
            </Text>
            <Text className="text-zinc-500 text-base mt-2 text-center">
              {t('app.tagline')}
            </Text>
          </View>

          {/* Social Login - 根据区域显示不同选项 */}
          {isChina ? (
            // 国内：微信登录
            <TouchableOpacity
              onPress={handleWeChatLogin}
              className="flex-row items-center justify-center bg-[#07C160] rounded-xl py-4 mb-6"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-wechat" size={24} color="#fff" />
              <Text className="text-white font-semibold text-base ml-3">
                {t('auth.continueWithWechat')}
              </Text>
            </TouchableOpacity>
          ) : (
            // 海外：Google 登录
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isGoogleLoading}
              className={`flex-row items-center justify-center rounded-xl py-4 mb-6 ${
                googleAvailable ? 'bg-white' : 'bg-zinc-800'
              }`}
              activeOpacity={0.8}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={googleAvailable ? '#000' : '#fff'} />
              ) : (
                <>
                  <Ionicons 
                    name="logo-google" 
                    size={20} 
                    color={googleAvailable ? '#000' : '#666'} 
                  />
                  <Text className={`font-semibold text-base ml-3 ${
                    googleAvailable ? 'text-black' : 'text-zinc-500'
                  }`}>
                    {t('auth.continueWithGoogle')}
                  </Text>
                  {!googleAvailable && (
                    <Text className="text-zinc-600 text-xs ml-2">(Dev Build)</Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-zinc-800" />
            <Text className="text-zinc-600 mx-4 text-sm">
              {isChina ? '或' : 'or'}
            </Text>
            <View className="flex-1 h-px bg-zinc-800" />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2 ml-1">{t('auth.email')}</Text>
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
                placeholder={isChina ? '请输入邮箱' : 'your@email.com'}
                placeholderTextColor="#52525B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white py-4 px-3 text-base"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2 ml-1">{t('auth.password')}</Text>
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
                placeholder="••••••••"
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

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleEmailLogin}
            disabled={isLoading}
            className="bg-violet-600 rounded-xl py-4 items-center"
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {t('auth.login')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-zinc-500">{t('auth.noAccount')} </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-violet-500 font-semibold">{t('auth.register')}</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Region Indicator */}
          <View className="mt-8 items-center">
            <TouchableOpacity
              onPress={() => useRegionStore.getState().toggleRegion()}
              className="flex-row items-center px-4 py-2 bg-zinc-900/50 rounded-full"
            >
              <Text className="text-zinc-500 text-xs">
                {isChina ? '🇨🇳 中国' : '🌍 International'}
              </Text>
              <Text className="text-zinc-600 text-xs ml-2">
                (tap to switch)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
