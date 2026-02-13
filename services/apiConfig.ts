import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get API base URL based on environment
 * 
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (if set)
 * 2. Automatic detection based on platform and execution environment
 * 
 * For physical devices, you may need to set EXPO_PUBLIC_API_URL to your computer's IP:
 * - Mac/Linux: run `ipconfig getifaddr en0` or `ifconfig | grep "inet "`
 * - Windows: run `ipconfig` and look for IPv4 Address
 * - Example: EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3001
 */
const getHostFromExpo = (): string | null => {
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const host = hostUri.split(':')[0];
  if (!host) {
    return null;
  }

  // Skip tunnel URLs (they don't work for backend API)
  // Tunnel URLs look like: jf5mll8-wasifkarim-8081.exp.direct
  if (host.includes('.exp.direct') || host.includes('.exp.tunnel')) {
    console.warn('⚠️ Tunnel mode detected. Please set EXPO_PUBLIC_API_URL to your Railway backend URL.');
    console.warn('   Example: EXPO_PUBLIC_API_URL=https://onlyswap-production.up.railway.app npx expo start --tunnel');
    return null;
  }

  return `http://${host}:3001`;
};

export const getApiBaseUrl = (): string => {
  // Check for environment variable override first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Production URL
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    // Use environment variable if set
    // IMPORTANT: Set EXPO_PUBLIC_API_URL in eas.json production profile
    const productionUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!productionUrl) {
      console.error(
        '❌ CRITICAL: EXPO_PUBLIC_API_URL is not set in production build!\n' +
        'Please set it in eas.json production profile or build command.\n' +
        'Example: eas build --platform all --profile production --env EXPO_PUBLIC_API_URL=https://your-backend.railway.app'
      );
      // Fallback - but this should never happen if configured correctly
      throw new Error('Production API URL not configured. Set EXPO_PUBLIC_API_URL in eas.json');
    }
    return productionUrl;
  }

  // Development mode
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  // Expo Go (physical devices) - try to infer host IP from Expo bundle URL
  if (isExpoGo) {
    const inferredUrl = getHostFromExpo();
    if (inferredUrl) {
      return inferredUrl;
    }
  }

  // Android emulator fallback
  if (isAndroid) {
    return 'http://10.0.2.2:3001';
  }

  // iOS - Expo Go (physical device) typically needs IP address
  // iOS Simulator can use localhost
  if (isIOS) {
    return 'http://localhost:3001';
  }

  // Default fallback
  return 'http://localhost:3001';
};

