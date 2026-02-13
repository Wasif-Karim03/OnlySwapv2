import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './apiConfig';

const TOKEN_KEY = '@onlyswap_token';

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
// Always log in production builds too, so we can debug connection issues
console.log(`🔧 API Base URL: ${API_BASE_URL}`);
// Always log in production builds too (helps debug connection issues)
const Constants = require('expo-constants').default;
console.log(`🔧 Environment Info:`, {
  API_BASE_URL,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || 'NOT SET',
  __DEV__: typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined',
  executionEnvironment: Constants.executionEnvironment || 'unknown',
  platform: require('react-native').Platform.OS,
});

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for large file uploads
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token to requests if available
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }

    // If sending FormData, remove Content-Type header so axios can set it automatically with boundary
    // Check for FormData - React Native FormData has _parts or getParts methods
    const isFormData = config.data && (
      config.data instanceof FormData ||
      (typeof config.data === 'object' && (
        config.data.constructor?.name === 'FormData' ||
        '_parts' in config.data ||
        typeof config.data.getParts === 'function' ||
        typeof config.data.append === 'function'
      ))
    );

    if (isFormData) {
      // For React Native FormData, we MUST delete Content-Type so axios can set it with boundary
      delete config.headers['Content-Type'];
      // Increase timeout for file uploads (5 minutes for large files)
      // Use the config timeout if set, otherwise use 5 minutes
      if (!config.timeout || config.timeout < 300000) {
        config.timeout = 300000; // 5 minutes
      }
      // Enhanced logging for uploads - ALWAYS log in production
      console.log(`📤 Upload Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log(`📤 Upload Timeout: ${config.timeout}ms`);
      console.log(`📤 Full URL: ${config.baseURL}${config.url}`);
      console.log(`📤 Headers before send:`, Object.keys(config.headers));
      if (config.data && typeof config.data === 'object' && '_parts' in config.data) {
        const parts = (config.data as any)._parts || [];
        console.log(`📤 FormData parts: ${parts.length} items`);
        let totalSize = 0;
        parts.forEach((part: any, index: number) => {
          if (index < 5) { // Log first 5 parts
            const partSize = typeof part[1] === 'object' && part[1].size ? part[1].size : 0;
            totalSize += partSize;
            console.log(`📤   Part ${index + 1}: ${part[0]} = ${typeof part[1] === 'object' ? `[File: ${part[1].name || 'unknown'} (${partSize} bytes)]` : `${part[1]} (${String(part[1]).length} bytes)`}`);
          }
        });
        console.log(`📤 Estimated total size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
      }
    } else {
      // Debug logging for non-upload requests
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return Promise.reject({
        message: errorMessage,
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // Request made but no response
      // Only log detailed error in dev mode
      if (__DEV__) {
        console.error('❌ Network error:', {
          url: error.config?.url,
          method: error.config?.method,
          code: error.code,
        });
      }

      // Check if this was a FormData upload
      const isFormDataRequest = error.config?.data && (
        error.config.data instanceof FormData ||
        (typeof error.config.data === 'object' && (
          error.config.data.constructor?.name === 'FormData' ||
          '_parts' in error.config.data
        ))
      );

      // Provide more helpful error message based on error code
      let errorMessage = 'Network error. Please check your connection.';

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        if (isFormDataRequest) {
          errorMessage = 'Cannot connect to server for file upload.\n\nPossible causes:\n• Backend server may have stopped\n• Network connection issue\n• Server may not support file uploads\n\nTry: Restart the backend server (cd backend && npm run dev)';
        } else {
          errorMessage = 'Cannot connect to server. Make sure the backend server is running.';
        }
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = isFormDataRequest
          ? `Upload timed out after ${error.config?.timeout || 60}s. The image may be too large or your connection is slow. Please try a smaller image or check your internet connection.`
          : 'Request timed out. Please check your connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `Cannot reach server at ${error.config?.baseURL || 'unknown'}. Check your network connection and verify the API URL is correct.`;
      } else if (error.config?.baseURL?.includes('localhost')) {
        errorMessage = 'Cannot connect to localhost. If you\'re on a physical device, set EXPO_PUBLIC_API_URL to your computer\'s IP address.';
      } else if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request && !error.response) {
        // Request was made but no response received
        errorMessage = `No response from server at ${error.config?.baseURL || 'unknown'}. The server may be down, unreachable, or the request timed out.`;
      }

      return Promise.reject({
        message: errorMessage,
        code: error.code,
        originalError: error.message
      });
    } else {
      // Something else happened
      console.error('❌ Request setup error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        originalError: error
      });
    }
  }
);

  }
);

// Add helper methods for reporting and blocking
export const reportEntity = async (data: {
  reportedUser?: string;
  reportedProduct?: string;
  reason: string;
  description?: string;
}) => {
  return api.post('/api/v1/reports', data);
};

export const blockUser = async (userId: string) => {
  return api.post('/api/v1/users/block', { userId });
};

export const unblockUser = async (userId: string) => {
  return api.delete(`/api/v1/users/block/${userId}`);
};

export const getBlockedUsers = async () => {
  return api.get('/api/v1/users/blocked');
};

export default api;

