import { View, ViewProps, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'highlight' | 'aurora' | 'inset';
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
}

export function GlassCard({
  children,
  variant = 'default',
  onPress,
  padding = 20,
  borderRadius = 24,
  style,
  ...props
}: GlassCardProps) {
  const variants = {
    default: {
      colors: ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    highlight: {
      colors: ['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.03)'],
      borderColor: 'rgba(168, 85, 247, 0.25)',
    },
    aurora: {
      colors: ['rgba(168, 85, 247, 0.08)', 'rgba(6, 182, 212, 0.05)', 'rgba(236, 72, 153, 0.06)'],
      borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    inset: {
      colors: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)'],
      borderColor: 'rgba(255, 255, 255, 0.04)',
    },
  };

  const currentVariant = variants[variant];

  const content = (
    <LinearGradient
      colors={currentVariant.colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          padding,
          borderRadius,
          borderWidth: 1,
          borderColor: currentVariant.borderColor,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Specialized Glass Components

interface BalanceCardProps {
  balance: number | string;
  label?: string;
  onRecharge?: () => void;
  onHistory?: () => void;
}

export function BalanceCard({
  balance,
  label = 'Available Credits',
  onRecharge,
  onHistory,
}: BalanceCardProps) {
  return (
    <GlassCard variant="aurora" padding={24} borderRadius={28}>
      {/* Background Glow Effect */}
      <View style={styles.glowContainer}>
        <View style={[styles.glowOrb, styles.glowOrbPurple]} />
        <View style={[styles.glowOrb, styles.glowOrbCyan]} />
      </View>

      {/* Content */}
      <View style={styles.balanceContent}>
        <Text style={styles.balanceLabel}>{label}</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceValue}>{balance}</Text>
          <Text style={styles.balanceUnit}>credits</Text>
        </View>

        {/* Action Buttons */}
        {(onRecharge || onHistory) && (
          <View style={styles.balanceActions}>
            {onRecharge && (
              <TouchableOpacity
                onPress={onRecharge}
                style={styles.balancePrimaryBtn}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#c084fc', '#a855f7', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.balancePrimaryBtnGradient}
                >
                  <Text style={styles.balanceBtnText}>Recharge</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {onHistory && (
              <TouchableOpacity
                onPress={onHistory}
                style={styles.balanceSecondaryBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.balanceBtnTextSecondary}>History</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </GlassCard>
  );
}

interface StatusBannerProps {
  type: 'warning' | 'success' | 'error' | 'info';
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
}

export function StatusBanner({
  type,
  title,
  description,
  icon,
  children,
}: StatusBannerProps) {
  const typeConfig = {
    warning: {
      colors: ['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.05)'],
      borderColor: 'rgba(245, 158, 11, 0.3)',
      iconColor: '#f59e0b',
      textColor: '#fbbf24',
      defaultIcon: 'warning' as const,
    },
    success: {
      colors: ['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.05)'],
      borderColor: 'rgba(16, 185, 129, 0.3)',
      iconColor: '#10b981',
      textColor: '#34d399',
      defaultIcon: 'checkmark-circle' as const,
    },
    error: {
      colors: ['rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.05)'],
      borderColor: 'rgba(239, 68, 68, 0.3)',
      iconColor: '#ef4444',
      textColor: '#f87171',
      defaultIcon: 'alert-circle' as const,
    },
    info: {
      colors: ['rgba(168, 85, 247, 0.12)', 'rgba(168, 85, 247, 0.05)'],
      borderColor: 'rgba(168, 85, 247, 0.3)',
      iconColor: '#a855f7',
      textColor: '#c084fc',
      defaultIcon: 'information-circle' as const,
    },
  };

  const config = typeConfig[type];

  return (
    <LinearGradient
      colors={config.colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.statusBanner, { borderColor: config.borderColor }]}
    >
      <View style={styles.statusBannerIcon}>
        <Ionicons
          name={icon || config.defaultIcon}
          size={22}
          color={config.iconColor}
        />
      </View>
      <View style={styles.statusBannerContent}>
        <Text style={[styles.statusBannerTitle, { color: config.textColor }]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.statusBannerDesc}>{description}</Text>
        )}
        {children}
      </View>
    </LinearGradient>
  );
}

interface InfoRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  valueColor?: string;
  onPress?: () => void;
}

export function InfoRow({
  icon,
  label,
  value,
  valueColor = '#f8fafc',
  onPress,
}: InfoRowProps) {
  const content = (
    <View style={styles.infoRow}>
      {icon && (
        <View style={styles.infoRowIcon}>
          <Ionicons name={icon} size={20} color="#a855f7" />
        </View>
      )}
      <View style={styles.infoRowContent}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={[styles.infoRowValue, { color: valueColor }]}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#52525b" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <GlassCard variant="default" padding={16} borderRadius={16}>
          {content}
        </GlassCard>
      </TouchableOpacity>
    );
  }

  return (
    <GlassCard variant="default" padding={16} borderRadius={16}>
      {content}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // Balance Card Styles
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  glowOrbPurple: {
    top: -100,
    left: -50,
    backgroundColor: 'rgba(168, 85, 247, 0.4)',
  },
  glowOrbCyan: {
    bottom: -100,
    right: -50,
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
  },
  balanceContent: {
    position: 'relative',
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  balancePrimaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  balancePrimaryBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  balanceSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  balanceBtnTextSecondary: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },

  // Status Banner Styles
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusBannerContent: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBannerDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },

  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoRowContent: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  infoRowValue: {
    fontSize: 17,
    fontWeight: '600',
  },
});



