import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { UserProvider, useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AlertProvider } from '@/utils/alert';

// Internal component that uses UserContext
function RootLayoutNavigator() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Redirect to landing page if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentSegment = segments[0];
      // If on a protected route, navigate to landing page
      if (currentSegment === '(tabs)' || currentSegment === 'add-product' || currentSegment === 'chat-room') {
        router.replace('/');
      }
    }
  }, [isLoading, isAuthenticated, segments, router]);

  // ✅ Always render Stack - NavigationContainer requires consistent structure
  // Show loading screen as overlay when loading
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <Stack 
          screenOptions={{ headerShown: false }}
          onUnhandledAction={(action) => {
            // Silently handle GO_BACK when there's no navigation history
            // This prevents errors when users try to go back from login page after logout
            if (action.type === 'GO_BACK') {
              // Navigate to landing page instead of showing error
              router.replace('/');
              return;
            }
            // Log other unhandled actions in development
            if (__DEV__) {
              console.warn('Unhandled navigation action:', action);
            }
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="create-account" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="verify-code" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="forgot-password" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="reset-password" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-product" options={{ headerShown: false }} />
          <Stack.Screen 
            name="edit-profile" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen 
            name="chat-room" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }} 
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {isLoading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <AuthLoadingScreen />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <UserProvider>
          <RootLayoutNavigator />
        </UserProvider>
      </AlertProvider>
    </GestureHandlerRootView>
  );
}
