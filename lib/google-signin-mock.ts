/**
 * Google Sign-In Mock for Expo Go
 * 
 * This module provides a mock implementation of @react-native-google-signin/google-signin
 * that allows the app to run in Expo Go without crashing due to missing native modules.
 * 
 * In Expo Go, native modules like Google Sign-In are not available.
 * This mock gracefully handles this limitation.
 */

// Status codes matching the real library
export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

// Mock GoogleSignin object
export const GoogleSignin = {
  configure: (_options?: any) => {
    console.log('[Mock] GoogleSignin.configure called');
  },

  hasPlayServices: async (_options?: any): Promise<boolean> => {
    console.log('[Mock] GoogleSignin.hasPlayServices called');
    return false;
  },

  signIn: async (): Promise<any> => {
    console.log('[Mock] GoogleSignin.signIn called');
    throw new Error('Google Sign-In is not available in Expo Go. Please use email login instead.');
  },

  signInSilently: async (): Promise<any> => {
    console.log('[Mock] GoogleSignin.signInSilently called');
    throw new Error('Google Sign-In is not available in Expo Go.');
  },

  signOut: async (): Promise<void> => {
    console.log('[Mock] GoogleSignin.signOut called');
  },

  revokeAccess: async (): Promise<void> => {
    console.log('[Mock] GoogleSignin.revokeAccess called');
  },

  isSignedIn: async (): Promise<boolean> => {
    console.log('[Mock] GoogleSignin.isSignedIn called');
    return false;
  },

  getCurrentUser: async (): Promise<null> => {
    console.log('[Mock] GoogleSignin.getCurrentUser called');
    return null;
  },

  getTokens: async (): Promise<{ accessToken: string | null; idToken: string | null }> => {
    console.log('[Mock] GoogleSignin.getTokens called');
    return { accessToken: null, idToken: null };
  },

  clearCachedAccessToken: async (_token: string): Promise<void> => {
    console.log('[Mock] GoogleSignin.clearCachedAccessToken called');
  },
};

// Mock GoogleSigninButton component
export const GoogleSigninButton = () => null;

// Export default for compatibility
export default {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
};
