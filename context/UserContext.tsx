import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, getToken, getUser as getUserData, signOut as authSignOut } from '@/services/authService_backend';

interface UserContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSellerMode: boolean;
  isLoggingOut: boolean;
  setUser: (user: UserData | null) => void;
  setIsSellerMode: (value: boolean) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSellerMode, setIsSellerMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Compute isAuthenticated from both token and user
  const isAuthenticated = !!authToken && !!user;

  const loadUser = async (silent = false) => {
    try {
      if (!silent) {
        console.log('🔄 Starting loadUser...');
        setIsLoading(true);
      }
      
      const token = await getToken();
      if (!silent) {
        console.log('🔑 Token check:', token ? 'Found' : 'Not found');
      }
      
      if (token) {
        try {
          const userData = await getUserData();
          if (!silent) {
            console.log('👤 User data check:', userData ? 'Found user' : 'No user data');
          }
          
          if (userData) {
            setUser(userData);
            setAuthToken(token);
            if (!silent) {
              console.log('✅ User loaded successfully');
            }
          } else {
            // If getUserData returns null, clear auth
            if (!silent) {
              console.log('⚠️  No user data, clearing auth');
            }
            setUser(null);
            setAuthToken(null);
          }
        } catch (userError) {
          // If getUserData fails, token might be invalid - clear it
          if (!silent) {
            console.error('❌ Error fetching user data:', userError);
          }
          setUser(null);
          setAuthToken(null);
        }
      } else {
        if (!silent) {
          console.log('🔓 No token found, user not authenticated');
        }
        setUser(null);
        setAuthToken(null);
      }
    } catch (error) {
      if (!silent) {
        console.error('❌ Error loading user:', error);
      }
      setUser(null);
      setAuthToken(null);
    } finally {
      if (!silent) {
        console.log('✅ loadUser completed, setting isLoading to false');
        setIsLoading(false);
      }
    }
  };

  const logout = async () => {
    console.log("🚪 Starting logout process...");
    
    try {
      // Use the auth service signOut to properly clear all auth data
      await authSignOut();
      console.log("✅ Auth data cleared from storage");
    } catch (error) {
      console.error('Error in authSignOut:', error);
      // Continue even if there's an error - we'll clear state anyway
    } finally {
      // Always reset user state immediately - this ensures the user is logged out locally
      setUser(null);
      setAuthToken(null);
      setIsSellerMode(false);
      setIsLoading(false); // CRITICAL: Stop showing loading screen
      
      console.log("✅ User context cleared");
    }
  };

  // Load user and settings on mount
  useEffect(() => {
    let isMounted = true;
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️  Loading took too long, forcing completion');
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    const loadUserAndSettings = async () => {
      await loadUser();
      
      // Load seller mode preference from settings
      if (isMounted) {
        try {
          const { loadSettings } = await import('@/services/settingsService');
          const settings = await loadSettings();
          setIsSellerMode(settings.isSellerMode || false);
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    };

    loadUserAndSettings().finally(() => {
      if (isMounted) {
        clearTimeout(timeoutId);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only load on mount

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
    isSellerMode,
    isLoggingOut,
    setUser,
    setIsSellerMode,
    loadUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

