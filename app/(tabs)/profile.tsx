import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/stores/useUserStore';
import { signOut } from '@/services/auth.service';
import { formatCredits } from '@/lib/utils';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  iconBgColor?: string;
  iconColor?: string;
};

function MenuItem({ 
  icon, 
  label, 
  value, 
  onPress, 
  danger,
  iconBgColor = 'rgba(168, 85, 247, 0.15)',
  iconColor = '#c084fc',
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.menuItem}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.menuItemGradient}
      >
        <View style={[
          styles.menuItemIcon,
          { backgroundColor: danger ? 'rgba(239, 68, 68, 0.15)' : iconBgColor }
        ]}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={danger ? '#ef4444' : iconColor} 
          />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}>
            {label}
          </Text>
        </View>
        {value && (
          <Text style={styles.menuItemValue}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color="#3f3f46" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, reset } = useUserStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              reset();
              router.replace('/login');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Aurora Background */}
      <View style={styles.auroraContainer}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.12)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb1]}
        />
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.1)', 'transparent']}
          style={[styles.auroraOrb, styles.auroraOrb2]}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.1)', 'rgba(6, 182, 212, 0.05)', 'rgba(236, 72, 153, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userCardGradient}
            >
              {/* Decorative Elements */}
              <View style={styles.userCardDecor}>
                <View style={[styles.decorOrb, styles.decorOrbPurple]} />
                <View style={[styles.decorOrb, styles.decorOrbCyan]} />
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#c084fc', '#a855f7', '#9333ea']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>
                      {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                  {/* Online Indicator */}
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {user?.display_name || 'User'}
                  </Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="diamond" size={16} color="#c084fc" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Credits</Text>
                    <Text style={styles.statValue}>
                      {formatCredits(user?.credit_balance || 0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, styles.statIconOrange]}>
                    <Text style={styles.statIcon}>🔥</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Streak</Text>
                    <Text style={[styles.statValue, styles.statValueOrange]}>
                      {user?.consecutive_successes || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <MenuItem
              icon="flash"
              label="Recharge Credits"
              iconBgColor="rgba(245, 158, 11, 0.15)"
              iconColor="#f59e0b"
              onPress={() => router.push('/(screens)/recharge')}
            />
            
            <MenuItem
              icon="time"
              label="Prediction History"
              iconBgColor="rgba(16, 185, 129, 0.15)"
              iconColor="#10b981"
              onPress={() => router.push('/(screens)/history')}
            />
            
            <MenuItem
              icon="receipt"
              label="Transaction History"
              iconBgColor="rgba(59, 130, 246, 0.15)"
              iconColor="#3b82f6"
              onPress={() => router.push('/(screens)/transactions')}
            />
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <MenuItem
              icon="notifications"
              label="Notifications"
              iconBgColor="rgba(236, 72, 153, 0.15)"
              iconColor="#ec4899"
              onPress={() => router.push('/(screens)/settings/notifications')}
            />
            
            <MenuItem
              icon="shield-checkmark"
              label="Privacy & Security"
              iconBgColor="rgba(6, 182, 212, 0.15)"
              iconColor="#06b6d4"
              onPress={() => router.push('/(screens)/settings/privacy')}
            />
            
            <MenuItem
              icon="help-circle"
              label="Help & Support"
              iconBgColor="rgba(168, 85, 247, 0.15)"
              iconColor="#a855f7"
              onPress={() => router.push('/(screens)/settings/help')}
            />
            
            <MenuItem
              icon="document-text"
              label="Terms of Service"
              iconBgColor="rgba(100, 116, 139, 0.15)"
              iconColor="#64748b"
              onPress={() => router.push('/(screens)/settings/terms')}
            />
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <MenuItem
              icon="log-out"
              label="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Aura v1.0.0</Text>
            </View>
            <Text style={styles.copyrightText}>© 2026 Aura. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    overflow: 'hidden',
  },
  auroraOrb: {
    position: 'absolute',
    borderRadius: 200,
  },
  auroraOrb1: {
    width: 350,
    height: 350,
    top: -150,
    left: -100,
  },
  auroraOrb2: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },

  // User Card
  userCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'hidden',
  },
  userCardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 28,
  },
  userCardDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 100,
  },
  decorOrbPurple: {
    width: 180,
    height: 180,
    top: -90,
    right: -60,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  decorOrbCyan: {
    width: 120,
    height: 120,
    bottom: -60,
    left: -40,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 18,
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statIconOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statIcon: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  statValueOrange: {
    color: '#fbbf24',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu Item
  menuItem: {
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
  },
  menuItemLabelDanger: {
    color: '#ef4444',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: 12,
    color: '#3f3f46',
  },
});
