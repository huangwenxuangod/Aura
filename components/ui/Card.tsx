import { View, ViewProps, Text } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'glass' | 'glass-highlight' | 'glass-inset' | 'outlined' | 'default' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'md' | 'lg' | 'xl' | '2xl';
  glow?: 'none' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Card({
  children,
  variant = 'glass',
  padding = 'md',
  borderRadius = 'xl',
  glow = 'none',
  style,
  ...props
}: CardProps) {
  // Padding configurations
  const paddingConfig = {
    none: 0,
    sm: 12,
    md: 20,
    lg: 24,
  };

  // Border radius configurations
  const borderRadiusConfig = {
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 28,
  };

  // Variant styles
  const variantStyles = {
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    'glass-highlight': {
      backgroundColor: 'rgba(168, 85, 247, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    'glass-inset': {
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    ghost: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const currentStyle = variantStyles[variant];
  const currentPadding = paddingConfig[padding];
  const currentBorderRadius = borderRadiusConfig[borderRadius];

  // For glass-highlight variant, use gradient border effect
  if (variant === 'glass-highlight') {
    return (
      <View
        style={[
          {
            borderRadius: currentBorderRadius,
            overflow: 'hidden',
          },
          style,
        ]}
        {...props}
      >
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.15)', 'rgba(6, 182, 212, 0.08)', 'rgba(236, 72, 153, 0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 1,
            borderRadius: currentBorderRadius,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderRadius: currentBorderRadius - 1,
              padding: currentPadding,
            }}
          >
            {children}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          ...currentStyle,
          padding: currentPadding,
          borderRadius: currentBorderRadius,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Specialized Card Components

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  valueColor?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  valueColor = '#f8fafc',
}: StatCardProps) {
  const trendColors = {
    up: '#10b981',
    down: '#ef4444',
    neutral: '#64748b',
  };

  return (
    <Card variant="glass" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '500' }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: valueColor }}>
          {value}
        </Text>
        {trend && trendValue && (
          <View
            style={{
              marginLeft: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: `${trendColors[trend]}20`,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: trendColors[trend], fontSize: 12, fontWeight: '600' }}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// Interactive Card with press feedback
interface InteractiveCardProps extends CardProps {
  onPress?: () => void;
}

export function InteractiveCard({
  children,
  onPress,
  ...props
}: InteractiveCardProps) {
  if (onPress) {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Card {...props}>{children}</Card>
      </TouchableOpacity>
    );
  }

  return <Card {...props}>{children}</Card>;
}
