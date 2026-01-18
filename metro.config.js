const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Mock native modules that aren't available in Expo Go
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Replace @react-native-google-signin/google-signin with our mock
  if (moduleName === '@react-native-google-signin/google-signin') {
    return {
      filePath: path.resolve(__dirname, 'lib/google-signin-mock.ts'),
      type: 'sourceFile',
    };
  }
  
  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
