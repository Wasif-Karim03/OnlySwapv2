import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  university: string;
  email: string;
  profilePicture?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserData;
    token: string;
  };
}

// Token storage keys
const TOKEN_KEY = '@onlyswap_token';
const USER_KEY = '@onlyswap_user';

/**
 * Save auth token to AsyncStorage
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

/**
 * Get auth token from AsyncStorage
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Save user data to AsyncStorage
 */
export const saveUser = async (user: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

/**
 * Get user data from AsyncStorage
 */
export const getUser = async (): Promise<UserData | null> => {
  try {
    const userString = await AsyncStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Remove auth data from AsyncStorage
 */
export const clearAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth:', error);
    throw error;
  }
};

export interface SignUpResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
  };
}

/**
 * Sign up with email and password (now sends verification code)
 */
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  university: string
): Promise<SignUpResponse> => {
  try {
    const response = await api.post<SignUpResponse>('/api/auth/signup', {
      firstName,
      lastName,
      university,
      email,
      password,
    });

    return response.data;
  } catch (error: any) {
    // Error is already logged by API interceptor, just throw user-friendly message
    throw new Error(
      error?.message || 'Failed to send verification code. Please try again.'
    );
  }
};

/**
 * Verify code and complete account creation
 */
export const verifyCode = async (
  email: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/verify-code', {
      email,
      code,
    });

    if (response.data.success && response.data.data) {
      // Save token and user data
      await saveToken(response.data.data.token);
      await saveUser(response.data.data.user);
    }

    return response.data;
  } catch (error: any) {
    // Error is already logged by API interceptor, just throw user-friendly message
    throw new Error(
      error?.message || 'Failed to verify code. Please try again.'
    );
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    if (response.data.success && response.data.data) {
      // Save token and user data
      await saveToken(response.data.data.token);
      await saveUser(response.data.data.user);
    }

    return response.data;
  } catch (error: any) {
    // Extract meaningful error message from API response
    // Our API interceptor formats errors as: { message, status, data: { message, success } }
    let errorMessage = 'Failed to sign in. Please try again.';
    
    // Priority order for extracting error message:
    // 1. error.message (from our API interceptor - already formatted)
    // 2. error.data.message (from response data)
    // 3. error.response.data.message (direct axios response)
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    // Only log error details in development (not in production)
    if (__DEV__) {
      console.error('Login error:', errorMessage);
    }
    
    // Throw error with user-friendly message that will be shown in Alert
    throw new Error(errorMessage);
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await clearAuth();
  } catch (error) {
    console.error('Signout error:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    return !!token;
  } catch (error) {
    return false;
  }
};

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Request password reset code
 */
export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  try {
    const response = await api.post<PasswordResetResponse>('/api/forgot-password', {
      email,
    });

    return response.data;
  } catch (error: any) {
    // Error is already logged by API interceptor, just throw user-friendly message
    throw new Error(
      error?.message || 'Failed to send reset code. Please try again.'
    );
  }
};

/**
 * Reset password with verification code
 */
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string
): Promise<PasswordResetResponse> => {
  try {
    const response = await api.post<PasswordResetResponse>('/api/reset-password', {
      email,
      code,
      newPassword,
      confirmPassword,
    });

    return response.data;
  } catch (error: any) {
    // Error is already logged by API interceptor, just throw user-friendly message
    throw new Error(
      error?.message || 'Failed to reset password. Please try again.'
    );
  }
};

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: UserData;
  };
}

/**
 * Update user profile (name and profile picture)
 */
export const updateProfile = async (
  firstName?: string,
  lastName?: string,
  profilePictureUri?: string
): Promise<UpdateProfileResponse> => {
  try {
    // First, verify server connectivity with a simple GET request
    try {
      await api.get('/health');
    } catch (healthError: any) {
      if (__DEV__) {
        console.warn('⚠️ Health check failed, but continuing with profile update...');
      }
      // Don't fail here, just log - the actual request will show the real error
    }

    const formData = new FormData();
    
    if (firstName !== undefined) {
      formData.append('firstName', firstName);
    }
    if (lastName !== undefined) {
      formData.append('lastName', lastName);
    }
    
    if (profilePictureUri) {
      // Extract filename from URI or generate one
      const uriParts = profilePictureUri.split('/');
      const filename = uriParts[uriParts.length - 1] || `profile_${Date.now()}.jpg`;
      
      // Detect image type from filename extension, default to jpeg
      let imageType = 'image/jpeg';
      const extension = filename.toLowerCase().split('.').pop();
      if (extension === 'png') {
        imageType = 'image/png';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        imageType = 'image/jpeg';
      } else if (extension === 'heic') {
        imageType = 'image/heic';
      }
      
      formData.append('profilePicture', {
        uri: profilePictureUri,
        name: filename,
        type: imageType,
      } as any);
    }

    // Axios will automatically set Content-Type with boundary for FormData (handled in api interceptor)
    const response = await api.put<UpdateProfileResponse>('/api/auth/profile', formData);

    if (response.data.success && response.data.data) {
      // Update stored user data
      await saveUser(response.data.data.user);
    }

    return response.data;
  } catch (error: any) {
    // Error is already logged by API interceptor, just throw user-friendly message
    throw new Error(
      error?.message || 'Failed to update profile. Please try again.'
    );
  }
};

