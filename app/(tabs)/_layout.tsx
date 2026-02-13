import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import socketService from '@/services/socketService';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user } = useUser();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const TabBarIcon = ({
    focused,
    activeIcon,
    inactiveIcon,
    badgeCount = 0,
  }: {
    focused: boolean;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    badgeCount?: number;
  }) => {
    const iconElement = (
      <View style={styles.iconWrapper}>
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={24}
          color={focused ? '#FFFFFF' : '#6B7280'}
        />
        {badgeCount > 0 && (
          <View style={[styles.badge, focused && styles.badgeActive]}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
    );

    return (
      <View style={styles.tabWrapper}>
        {focused ? (
          <LinearGradient
            colors={['#6cc27a', '#2FC262']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconPill, styles.iconPillActive]}
          >
            {iconElement}
          </LinearGradient>
        ) : (
          <View style={styles.iconPill}>
            {iconElement}
          </View>
        )}
      </View>
    );
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadNotificationCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get<{ success: boolean; count: number }>(
          '/api/notifications/unread/count'
        );
        if (response.data.success) {
          setUnreadNotificationCount(response.data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    fetchUnreadCount();

    // Setup Socket.IO listener for real-time notification updates
    let isMounted = true;
    const setupSocket = async () => {
      try {
        await socketService.connect(user.id);
        if (isMounted) {
          socketService.onNewNotification(() => {
            // Refresh unread count when new notification arrives
            fetchUnreadCount();
          });
        }
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    setupSocket();

    // Refresh count every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      isMounted = false;
      socketService.offNewNotification();
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  // Fetch unread message count for chat tab
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadMessageCount(0);
      return;
    }

    const fetchUnreadMessageCount = async () => {
      try {
        const response = await api.get<{ success: boolean; count: number }>(
          '/api/chats/unread/count'
        );
        if (response.data.success) {
          setUnreadMessageCount(response.data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      }
    };

    fetchUnreadMessageCount();

    // Setup Socket.IO listener for real-time message updates
    let isMounted = true;
    const setupSocket = async () => {
      try {
        await socketService.connect(user.id);
        if (isMounted) {
          socketService.onNewMessage(() => {
            // Refresh unread message count when new message arrives
            // Add small delay to ensure database is updated
            setTimeout(() => {
              if (isMounted) {
                fetchUnreadMessageCount();
              }
            }, 500);
          });
        }
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    setupSocket();

    // Refresh count every 30 seconds as fallback
    const interval = setInterval(fetchUnreadMessageCount, 30000);

    return () => {
      isMounted = false;
      socketService.offNewMessage();
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  // ✅ Always return Tabs - Expo Router requires consistent navigation structure
  // Root layout will handle redirects if not authenticated
  // Individual screens can handle their own auth checks
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: 26,
          height: 72,
          paddingBottom: 10,
          paddingTop: 12,
          shadowColor: '#4caf50',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },
        tabBarItemStyle: {
          marginHorizontal: 6,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              activeIcon="apps"
              inactiveIcon="apps-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              activeIcon="megaphone"
              inactiveIcon="megaphone-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              activeIcon="chatbubbles"
              inactiveIcon="chatbubbles-outline"
              badgeCount={unreadMessageCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              activeIcon="notifications"
              inactiveIcon="notifications-outline"
              badgeCount={unreadNotificationCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              activeIcon="person"
              inactiveIcon="person-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide this from tabs
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconPill: {
    width: 60,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#F87171',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeActive: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
