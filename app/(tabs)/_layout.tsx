import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-2">
      <Ionicons
        name={name}
        size={24}
        color={focused ? '#FFFFFF' : '#6B7280'}
      />
      <Text
        className={`text-xs mt-1 ${focused ? 'text-white' : 'text-gray-500'}`}
      >
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
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#27272A',
          height: 80,
          paddingBottom: 20,
        },
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
