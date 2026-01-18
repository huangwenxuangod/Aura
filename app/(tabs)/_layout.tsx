import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={focused ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap}
        size={22}
        color={focused ? '#FFFFFF' : '#6b7280'}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="首页" />
          ),
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="flag" focused={focused} label="预测" />
          ),
        }}
      />
      <Tabs.Screen
        name="referee"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="eye" focused={focused} label="监督" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="我的" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#030712',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 0,
    shadowOpacity: 0,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
