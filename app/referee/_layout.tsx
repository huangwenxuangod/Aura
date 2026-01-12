import { Stack } from 'expo-router';

export default function RefereeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="[code]" />
    </Stack>
  );
}

