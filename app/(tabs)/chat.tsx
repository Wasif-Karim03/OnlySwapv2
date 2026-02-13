import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import socketService from '@/services/socketService';
import { getApiBaseUrl } from '@/services/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface ChatThread {
  threadId: string;
  otherUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  product: {
    _id: string;
    title: string;
    imageUrl?: string;
  } | null;
  lastMessageAt: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [threadId: string]: number }>({});
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const fabOpacity = useSharedValue(0);
  const fabScale = useSharedValue(1);
  const fabTranslateY = useSharedValue(20);

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

    // FAB animation
    fabOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    fabTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 90, mass: 1 }));
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    return {
      opacity: headerOpacity.value,
      transform: [
        { translateY: headerTranslateY.value },
        { scale },
      ],
    };
  });

  const fabStyle = useAnimatedStyle(() => {
    const show = scrollY.value < 10 ? 1 : 0;
    return {
      opacity: fabOpacity.value * show,
      transform: [
        { translateY: fabTranslateY.value },
        { scale: fabScale.value },
      ],
    };
  });

  const AnimatedView = Animated.View;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  // Handle scroll for header shrink and FAB visibility
  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  // Fetch unread message notification counts per thread
  const fetchUnreadCounts = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setUnreadCounts({});
      return;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: { [threadId: string]: number };
        total: number;
      }>('/api/notifications/messages/unread');

      if (response.data.success) {
        console.log(`✅ Loaded unread message counts for ${Object.keys(response.data.data).length} thread(s)`);
        setUnreadCounts(response.data.data || {});
      }
    } catch (error: any) {
      console.error('❌ Error fetching unread message counts:', error);
      setUnreadCounts({});
    }
  }, [user, isAuthenticated]);

  // Fetch chat threads from API
  const fetchChats = useCallback(async (showRefreshIndicator = false) => {
    // Don't fetch when logged out
    if (!user || !isAuthenticated) {
      setIsLoading(false);
      setChats([]);
      return;
    }

    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('🔍 Fetching chats for user:', user.id);
      const response = await api.get<{ success: boolean; data: ChatThread[] }>('/api/chats');
      
      console.log('📬 Chats API response:', response.data);
      
      if (response.data.success) {
        const chatsData = response.data.data || [];
        console.log(`✅ Loaded ${chatsData.length} chat thread(s)`);
        setChats(chatsData);
        // Fetch unread counts after loading chats
        await fetchUnreadCounts();
      } else {
        const errorMsg = 'Failed to load chats';
        console.error('❌ Chats API error:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load chats. Please try again.';
      setError(errorMessage);
      setChats([]); // Clear chats on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isAuthenticated, fetchUnreadCounts]);

  // Load chats on mount and when screen comes into focus
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Clean up on logout - prevent background fetches when not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setChats([]);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Refresh when screen comes into focus (e.g., returning from chat room)
  useFocusEffect(
    useCallback(() => {
      fetchChats();
      fetchUnreadCounts();
    }, [fetchChats, fetchUnreadCounts])
  );

  // Setup Socket.IO listener for real-time message notifications
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
          // Listen for new message notifications
          const handleNewNotification = (data: any) => {
            console.log('🔔 New message notification received in Chat tab:', data);
            // Only refresh unread counts if it's a message notification
            if (data.type === 'message' && data.threadId) {
              fetchUnreadCounts();
            }
          };

          socketService.onNewNotification(handleNewNotification);
          console.log('✅ Socket.IO message notification listener set up in Chat tab');
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
  }, [user, isAuthenticated, fetchUnreadCounts]);

  // Format timestamp for display
  const formatTimestamp = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    const date = moment(dateString);
    const now = moment();
    const diffDays = now.diff(date, 'days');

    if (diffDays === 0) {
      return date.format('h:mm A'); // Today: show time
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.format('ddd'); // Day of week
    } else {
      return date.format('M/D/YY'); // Date
    }
  };

  // Get contact name from thread
  const getContactName = (chat: ChatThread): string => {
    if (chat.otherUser) {
      return `${chat.otherUser.firstName} ${chat.otherUser.lastName}`.trim() || chat.otherUser.email;
    }
    return 'Unknown';
  };

  // Get contact initials
  const getContactInitials = (chat: ChatThread): string => {
    if (chat.otherUser) {
      const firstName = chat.otherUser.firstName || '';
      const lastName = chat.otherUser.lastName || '';
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
    }
    return '?';
  };

  // Helper to get full image URL from relative path or full URL (ensures HTTPS for iOS)
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    
    // If it's already a full URL, ensure it's HTTPS (iOS requires HTTPS)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      if (imagePath.startsWith('http://')) {
        if (__DEV__) {
          console.warn('⚠️ Converting HTTP to HTTPS for iOS compatibility:', imagePath);
        }
        return imagePath.replace('http://', 'https://');
      }
      return imagePath;
    }
    
    // Check if it's a Cloudinary URL path (without protocol)
    if (imagePath.includes('cloudinary.com') || 
        (imagePath.includes('/image/upload/') && !imagePath.startsWith('/'))) {
      if (imagePath.startsWith('res.cloudinary.com')) {
        return `https://${imagePath}`;
      }
      const parts = imagePath.split('/');
      if (parts.length >= 3 && parts[1] === 'image' && parts[2] === 'upload') {
        const cloudName = parts[0];
        const path = parts.slice(1).join('/');
        return `https://res.cloudinary.com/${cloudName}/${path}`;
      }
      return `https://res.cloudinary.com/${imagePath}`;
    }
    
    // It's a local path - construct URL using API base URL
    let path = '';
    if (imagePath.startsWith('/')) {
      path = imagePath;
    } else {
      path = `/${imagePath}`;
    }
    
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}${path}`;
    
    // Ensure HTTPS for iOS
    if (url.startsWith('http://') && Platform.OS === 'ios') {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  // Chat Card Component with animations
  const ChatCard = React.memo(({ chat, index, unreadCount, onPress }: {
    chat: ChatThread;
    index: number;
    unreadCount: number;
    onPress: () => void;
  }) => {
    const contactName = getContactName(chat);
    const initials = getContactInitials(chat);
    const lastMessageText = chat.lastMessage?.text || 'No messages yet';
    const timestamp = formatTimestamp(chat.lastMessageAt || chat.lastMessage?.createdAt);
    const productTitle = chat.product?.title || 'Unknown Product';
    const productImageUrl = chat.product?.imageUrl ? getImageUrl(chat.product.imageUrl) : null;
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Reset image error when product image URL changes
    useEffect(() => {
      setImageError(false);
      setImageLoading(true);
    }, [productImageUrl]);

    // Animation shared values
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);
    const scale = useSharedValue(1);
    const pulseScale = useSharedValue(1);
    const translateX = useSharedValue(0);

    // Staggered entrance animation
    useEffect(() => {
      opacity.value = withDelay(
        index * 80 + 200,
        withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        })
      );
      translateY.value = withDelay(
        index * 80 + 200,
        withSpring(0, {
          damping: 15,
          stiffness: 90,
          mass: 1,
        })
      );
    }, [index]);

    // Pulsing animation for unread badge
    useEffect(() => {
      if (unreadCount > 0) {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      } else {
        pulseScale.value = withTiming(1, { duration: 300 });
      }
    }, [unreadCount]);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { translateX: translateX.value },
      ],
    }));

    const badgeStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseScale.value }],
    }));

    const swipeStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateX.value,
        [-100, -50],
        [1, 0],
        Extrapolate.CLAMP
      ),
    }));

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Tap animation
      scale.value = withSequence(
        withSpring(0.96, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      
      setTimeout(() => {
        onPress();
      }, 150);
    };

    // Swipe gesture for quick actions - DISABLED until archive feature is implemented
    // TODO: Re-enable when archive functionality is implemented
    /*
    const swipeGesture = Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationX < 0) {
          translateX.value = Math.max(e.translationX, -100);
        }
      })
      .onEnd((e) => {
        if (e.translationX < -50) {
          translateX.value = withSpring(-80);
        } else {
          translateX.value = withSpring(0);
        }
      });

    const handleArchive = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      translateX.value = withSpring(0);
      // TODO: Implement archive action
    };
    */

    return (
      <View style={styles.chatCardWrapper}>
        {/* Swipe gesture disabled until archive feature is implemented */}
        <AnimatedPressable
          style={[styles.chatItem, cardStyle]}
          onPress={handlePress}
        >
            <View style={styles.chatIcon}>
              {productImageUrl && !imageError ? (
                <>
                  {imageLoading && (
                    <View style={styles.chatIconLoading}>
                      <ActivityIndicator size="small" color="#22C55E" />
                    </View>
                  )}
                  <Image
                    source={{ 
                      uri: productImageUrl,
                    }}
                    style={styles.chatIconImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onLoadStart={() => {
                      setImageLoading(true);
                      if (__DEV__ && Platform.OS === 'ios') {
                        console.log('🔄 iOS: Starting to load chat list image:', productImageUrl);
                      }
                    }}
                    onLoad={() => {
                      setImageLoading(false);
                      if (__DEV__ && Platform.OS === 'ios') {
                        console.log('✅ iOS: Chat list image loaded successfully:', productImageUrl);
                      }
                    }}
                    onError={(error) => {
                      if (__DEV__) {
                        console.error('❌ Chat list image error:', {
                          platform: Platform.OS,
                          url: productImageUrl,
                          error: error,
                        });
                      }
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    accessibilityLabel="Product image"
                  />
                  <View style={styles.chatIconShadow} />
                </>
              ) : (
                <>
                  <LinearGradient
                    colors={['#3BB75E', '#2CA654']}
                    style={styles.chatIconGradient}
                  >
                    <Text style={styles.chatIconText}>{initials}</Text>
                  </LinearGradient>
                  <View style={styles.chatIconShadow} />
                </>
              )}
            </View>
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{contactName}</Text>
                <View style={styles.chatHeaderRight}>
                  {timestamp && <Text style={styles.chatTimestamp}>{timestamp}</Text>}
                  {unreadCount > 0 && (
                    <Animated.View style={[styles.unreadBadge, badgeStyle]}>
                      <LinearGradient
                        colors={['#22C55E', '#16A34A']}
                        style={styles.unreadBadgeGradient}
                      >
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>
              </View>
              <View style={styles.chatDetails}>
                <Ionicons name="cube-outline" size={12} color="#22C55E" style={styles.productIcon} />
                <Text style={styles.productTitle}>{productTitle}</Text>
              </View>
              <Text 
                style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} 
                numberOfLines={1}
              >
                {lastMessageText}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.chevron} />
          </AnimatedPressable>
        {/* Swipe actions disabled until archive feature is implemented */}
        {/* 
        <Animated.View style={[styles.swipeActions, swipeStyle]}>
          <Pressable
            style={styles.swipeActionButton}
            onPress={handleArchive}
          >
            <Ionicons name="archive-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
        */}
      </View>
    );
  });

  // Render chat list item
  const renderChat = ({ item: chat, index }: { item: ChatThread; index: number }) => {
    const unreadCount = unreadCounts[chat.threadId] || 0;
    const contactName = getContactName(chat);

    return (
      <ChatCard
        chat={chat}
        index={index}
        unreadCount={unreadCount}
        onPress={() => {
          router.push({ 
            pathname: '/chat-room', 
            params: { 
              threadId: chat.threadId,
              contactName,
              contactId: chat.otherUser?._id || '',
              productTitle: chat.product?.title || 'Unknown Product',
              productImage: chat.product?.imageUrl || '',
            } 
          });
        }}
      />
    );
  };

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (isLoading && chats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#D1FAE5', '#A7F3D0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AnimatedView style={[styles.heroContent, headerStyle]}>
          <View style={styles.heroRow}>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>Messages</Text>
              <Text style={styles.heroSubtitle}>Stay connected with buyers & sellers</Text>
            </View>
            <Pressable
              style={styles.heroButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                fetchChats(true);
                fetchUnreadCounts();
              }}
            >
              <LinearGradient
                colors={['#34d399', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroButtonGradient}
              >
                <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
                <Text style={styles.heroButtonText}>Refresh</Text>
              </LinearGradient>
            </Pressable>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <View style={[styles.heroStatIcon, styles.heroStatIconAlt]}>
                <Ionicons name="mail-unread-outline" size={18} color="#0c4a6e" />
              </View>
              <View style={styles.heroStatTextContainer}>
                <Text style={styles.heroStatLabel}>Unread Messages</Text>
                <Text style={styles.heroStatValue}>{totalUnread}</Text>
              </View>
            </View>
          </View>
        </AnimatedView>
      </LinearGradient>

      <View style={styles.body}>
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {chats.length === 0 && !isLoading ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconAura}>
              <Ionicons name="chatbubbles-outline" size={44} color="#22C55E" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by placing a bid on a product you love.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chats}
            renderItem={renderChat}
            keyExtractor={(item) => item.threadId}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchChats(true)}
                tintColor="#22C55E"
                colors={['#22C55E']}
              />
            }
          />
        )}
      </View>
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
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  heroContent: {
    gap: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#047857',
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 20,
  },
  heroButton: {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.15)',
    alignSelf: 'flex-start',
  },
  heroStatTextContainer: {
    justifyContent: 'center',
    minWidth: 0,
  },
  heroStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatIconAlt: {
    backgroundColor: 'rgba(14,116,144,0.12)',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  heroStatValue: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    marginTop: 32,
  },
  emptyIconAura: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyAction: {
    width: '100%',
    marginTop: 20,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  chatList: {
    paddingBottom: 120,
  },
  chatCardWrapper: {
    marginBottom: 16,
    position: 'relative',
    overflow: 'visible',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.5)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    position: 'relative',
  },
  chatIconShadow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    top: 2,
    left: 0,
    zIndex: -1,
  },
  chatIconImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  chatIconLoading: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  chatIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chatIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 24,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chatDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  productIcon: {
    marginTop: 1,
  },
  productTitle: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  chevron: {
    marginLeft: 4,
  },
  swipeActions: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  swipeActionButton: {
    width: 60,
    height: '100%',
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1000,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

