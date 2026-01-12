import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  fullWidth = false,
  glow = false,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const isLoadingState = loading || isLoading;
  const isDisabled = disabled || isLoadingState;

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontSize: 14,
      iconSize: 16,
    },
    md: {
      height: 52,
      paddingHorizontal: 24,
      borderRadius: 16,
      fontSize: 16,
      iconSize: 20,
    },
    lg: {
      height: 60,
      paddingHorizontal: 32,
      borderRadius: 18,
      fontSize: 18,
      iconSize: 24,
    },
  };

  const config = sizeConfig[size];

  // Gradient colors for primary variant
  const gradientColors: Record<string, string[]> = {
    primary: ['#c084fc', '#a855f7', '#9333ea'],
    success: ['#34d399', '#10b981', '#059669'],
    danger: ['#f87171', '#ef4444', '#dc2626'],
  };

  // Render primary button with gradient
  if (variant === 'primary' || variant === 'success' || variant === 'danger') {
    const colors = gradientColors[variant as keyof typeof gradientColors] || gradientColors.primary;
    
    return (
      <TouchableOpacity
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          fullWidth && { width: '100%' },
          style,
        ]}
        {...props}
      >
        <LinearGradient
          colors={isDisabled ? ['#52525b', '#3f3f46', '#27272a'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: config.borderRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {isLoadingState ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: config.fontSize,
                  fontWeight: '600',
                  letterSpacing: -0.2,
                }}
              >
                {children}
              </Text>
              {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Variant styles for non-gradient buttons
  const variantStyles = {
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: 'rgba(168, 85, 247, 0.5)',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const textColors = {
    secondary: '#f8fafc',
    outline: '#c084fc',
    ghost: '#c084fc',
  };

  const currentVariantStyle = variantStyles[variant as keyof typeof variantStyles] || variantStyles.secondary;
  const textColor = textColors[variant as keyof typeof textColors] || '#f8fafc';

  return (
    <TouchableOpacity
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.borderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
          ...currentVariantStyle,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      {...props}
    >
      {isLoadingState ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text
            style={{
              color: textColor,
              fontSize: config.fontSize,
              fontWeight: '600',
              letterSpacing: -0.2,
            }}
          >
            {children}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
