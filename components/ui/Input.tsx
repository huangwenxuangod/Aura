import { View, TextInput, Text, TextInputProps, Animated, StyleSheet } from 'react-native';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  required?: boolean;
  variant?: 'default' | 'filled' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  required,
  variant = 'glass',
  size = 'md',
  className = '',
  onFocus,
  onBlur,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 44,
      paddingHorizontal: 14,
      fontSize: 14,
      borderRadius: 12,
      labelSize: 12,
    },
    md: {
      height: 52,
      paddingHorizontal: 16,
      fontSize: 16,
      borderRadius: 14,
      labelSize: 13,
    },
    lg: {
      height: 60,
      paddingHorizontal: 18,
      fontSize: 18,
      borderRadius: 16,
      labelSize: 14,
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const variantStyles = {
    default: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderColor: error
        ? 'rgba(239, 68, 68, 0.5)'
        : isFocused
        ? 'rgba(168, 85, 247, 0.5)'
        : 'rgba(255, 255, 255, 0.08)',
    },
    filled: {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: error
        ? 'rgba(239, 68, 68, 0.5)'
        : isFocused
        ? 'rgba(168, 85, 247, 0.5)'
        : 'transparent',
    },
    glass: {
      backgroundColor: isFocused
        ? 'rgba(168, 85, 247, 0.05)'
        : 'rgba(0, 0, 0, 0.25)',
      borderColor: error
        ? 'rgba(239, 68, 68, 0.5)'
        : isFocused
        ? 'rgba(168, 85, 247, 0.4)'
        : 'rgba(255, 255, 255, 0.06)',
    },
  };

  const currentStyle = variantStyles[variant];

  // Animated border color
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)',
      error ? 'rgba(239, 68, 68, 0.6)' : 'rgba(168, 85, 247, 0.5)',
    ],
  });

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { fontSize: config.labelSize }]}>
            {label}
          </Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            height: config.height,
            borderRadius: config.borderRadius,
            backgroundColor: currentStyle.backgroundColor,
            borderWidth: 1,
            borderColor: borderColor,
          },
        ]}
      >
        {leftIcon && (
          <View style={[styles.iconContainer, { paddingLeft: config.paddingHorizontal }]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              fontSize: config.fontSize,
              paddingHorizontal: leftIcon ? 12 : config.paddingHorizontal,
              paddingRight: rightIcon ? 12 : config.paddingHorizontal,
            },
          ]}
          placeholderTextColor="#52525b"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && (
          <View style={[styles.iconContainer, { paddingRight: config.paddingHorizontal }]}>
            {rightIcon}
          </View>
        )}
      </Animated.View>

      {(error || hint) && (
        <View style={styles.helperContainer}>
          <Text style={[styles.helper, error ? styles.errorText : undefined]}>
            {error || hint}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 4,
  },
  label: {
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  required: {
    color: '#ef4444',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    height: '100%',
  },
  helperContainer: {
    marginTop: 6,
    marginLeft: 4,
  },
  helper: {
    fontSize: 12,
    color: '#64748b',
  },
  errorText: {
    color: '#ef4444',
  },
});

// Specialized Input Components

interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (text: string) => void;
}

export function SearchInput({ onSearch, ...props }: SearchInputProps) {
  const { Ionicons } = require('@expo/vector-icons');

  return (
    <Input
      leftIcon={<Ionicons name="search" size={20} color="#64748b" />}
      placeholder="Search..."
      returnKeyType="search"
      onSubmitEditing={(e) => onSearch?.(e.nativeEvent.text)}
      {...props}
    />
  );
}

// Text Area Component
interface TextAreaProps extends InputProps {
  rows?: number;
}

export function TextArea({ rows = 4, style, ...props }: TextAreaProps) {
  const minHeight = rows * 24 + 32; // Approximate line height + padding

  return (
    <Input
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      style={[{ minHeight }, style]}
      {...props}
    />
  );
}
