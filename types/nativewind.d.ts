import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface SafeAreaViewProps {
    className?: string;
  }
}

declare module 'react-native-reanimated' {
  interface AnimatedProps<T> {
    className?: string;
  }
}

