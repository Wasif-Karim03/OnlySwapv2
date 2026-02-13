import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import socketService from '@/services/socketService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface Notification {
  _id: string;
  type: 'bid' | 'message' | 'sale' | 'admin_message';
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const AnimatedView = Animated.View;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showRefreshIndicator = false) => {
    if (!user || !isAuthenticated) {
      setIsLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('🔔 Fetching notifications for user:', user.id);
      const response = await api.get<{
        success: boolean;
        data: Notification[];
        unreadCount: number;
      }>('/api/notifications');

      if (response.data.success) {
        const notificationsData = response.data.data || [];
        console.log(`✅ Loaded ${notificationsData.length} notification(s), ${response.data.unreadCount} unread`);
        setNotifications(notificationsData);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isAuthenticated]);

  // Load notifications on mount and when screen comes into focus
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Setup Socket.IO listener for real-time notifications
  useEffect(() => {
    if (!user || !isAuthenticated) {
      socketService.offNewNotification();
      return;
    }

    let isMounted = true;

    const setupSocket = async () => {
      try {
        await socketService.connect(user.id);

        if (isMounted) {
          // Listen for new notifications
          const handleNewNotification = (data: any) => {
            console.log('🔔 New notification received:', data);
            // Refresh notifications list
            fetchNotifications();
          };

          socketService.onNewNotification(handleNewNotification);
          console.log('✅ Socket.IO notification listener set up');
        }
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      socketService.offNewNotification();
    };
  }, [user, isAuthenticated, fetchNotifications]);

  // Clean up on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      socketService.offNewNotification();
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    if ((notification.type === 'message' || notification.type === 'bid') && notification.relatedId) {
      // relatedId contains threadId - fetch thread details and navigate to chat room
      try {
        const response = await api.get(`/api/chats/thread/${notification.relatedId}`);
        if (response.data.success) {
          const threadData = response.data.data;
          router.push({
            pathname: '/chat-room',
            params: {
              threadId: threadData.threadId,
              contactName: threadData.contactName,
              contactId: threadData.contactId,
              productTitle: threadData.productTitle,
              productImage: threadData.productImage || '',
            },
          });
        } else {
          // Fallback to chat list if thread not found
          router.push('/chat');
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
        // Fallback to chat list on error
        router.push('/chat');
      }
    } else if (notification.type === 'sale' && notification.relatedId) {
      // Navigate to product details (future feature)
      console.log('Navigate to product:', notification.relatedId);
    } else if (notification.type === 'admin_message') {
      // Admin messages - just mark as read, message is already displayed
      // Could navigate to product details if relatedId is a product ID
      if (notification.relatedId) {
        console.log('Admin message for product:', notification.relatedId);
        // Could navigate to product details in the future
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString: string): string => {
    const date = moment(dateString);
    const now = moment();
    const diffMinutes = now.diff(date, 'minutes');
    const diffHours = now.diff(date, 'hours');
    const diffDays = now.diff(date, 'days');

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.format('MMM D, YYYY');
    }
  };

  // Get notification icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return 'gift-outline';
      case 'message':
        return 'chatbubble-outline';
      case 'sale':
        return 'checkmark-circle-outline';
      case 'admin_message':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Get notification icon color
  const getIconColor = (type: string) => {
    switch (type) {
      case 'bid':
        return '#22C55E';
      case 'message':
        return '#3B82F6';
      case 'sale':
        return '#10B981';
      case 'admin_message':
        return '#EF4444';
      default:
        return '#94a3b8';
    }
  };

  // Get notification title
  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'bid':
        return 'New Bid';
      case 'message':
        return 'New Message';
      case 'sale':
        return 'Sale Completed';
      case 'admin_message':
        return 'Admin Message';
      default:
        return 'Notification';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleNotificationPress(item);
      }}
    >
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[`${getIconColor(item.type)}20`, `${getIconColor(item.type)}10`]}
          style={styles.iconGradient}
        >
          <Ionicons
            name={getIcon(item.type) as any}
            size={24}
            color={getIconColor(item.type)}
          />
        </LinearGradient>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{getNotificationTitle(item.type)}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </Pressable>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <AnimatedView style={[styles.header, headerStyle]}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </AnimatedView>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchNotifications(true)}
                tintColor="#22C55E"
                colors={['#22C55E']}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={80} color="#22C55E" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              You're all caught up!{'\n'}You'll see notifications here when you receive bids or messages.
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 252, 231, 0.3)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#14532D',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 28,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.4)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: 'rgba(240, 253, 244, 0.6)',
    borderColor: 'rgba(220, 252, 231, 0.6)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14532D',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
});
