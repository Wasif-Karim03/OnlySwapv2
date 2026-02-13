import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { ChatBubble } from '@/components/marketplace/ChatBubble';
import { useUser } from '@/context/UserContext';
import socketService from '@/services/socketService';
import api, { blockUser } from '@/services/api';
import { getApiBaseUrl } from '@/services/apiConfig';
import { ReportModal } from '@/components/ReportModal';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { threadId, contactName, contactId, productTitle, productImage, autoMessage } = params;
  const { user, isAuthenticated } = useUser();

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [headerImageError, setHeaderImageError] = useState(false);
  const [headerImageLoading, setHeaderImageLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Helper to get full image URL (ensures HTTPS for iOS)
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
    let path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}${path}`;

    // Ensure HTTPS for iOS
    if (url.startsWith('http://') && Platform.OS === 'ios') {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const productImageUrl = productImage ? getImageUrl(productImage) : null;

  // Reset image error when product image URL changes
  useEffect(() => {
    setHeaderImageError(false);
    setHeaderImageLoading(true);
  }, [productImageUrl]);

  // Initialize messages with auto message if provided
  useEffect(() => {
    if (autoMessage) {
      try {
        const parsedAutoMessage = JSON.parse(autoMessage as string);
        setMessages([parsedAutoMessage]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing auto message:', error);
      }
    }
  }, [autoMessage]);

  // Load chat history and mark message notifications as read
  useEffect(() => {
    // Don't fetch when logged out
    if (!user || !isAuthenticated) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const loadChatHistory = async () => {
      // Skip if we already have auto message loaded
      if (autoMessage) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/chats/thread/${threadId}/messages`);
        setMessages(response.data.data || []);

        // Mark all messages in this thread as read for the current user
        try {
          await api.put(`/api/chats/thread/${threadId}/read`);
          console.log('✅ Marked messages as read for thread:', threadId);
        } catch (readError: any) {
          console.error('⚠️ Error marking messages as read:', readError);
          // Don't fail the whole chat load if this fails
        }

        // Mark all message notifications for this thread as read
        try {
          await api.put(`/api/notifications/messages/thread/${threadId}/read`);
          console.log('✅ Marked message notifications as read for thread:', threadId);
        } catch (notifError: any) {
          console.error('⚠️ Error marking message notifications as read:', notifError);
          // Don't fail the whole chat load if this fails
        }
      } catch (error: any) {
        // If thread doesn't exist yet, that's ok - just show empty messages
        if (error.message?.includes('Route not found') || error.message?.includes('Not authorized') || error.message?.includes('Thread not found')) {
          console.log('Thread not found yet, starting new conversation');
          setMessages([]);
        } else {
          console.error('Error loading chat history:', error);
          Alert.alert('Error', 'Failed to load chat history. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      loadChatHistory();
    }
  }, [threadId, autoMessage, user, isAuthenticated]);

  // Setup Socket.IO connection
  useEffect(() => {
    // Don't connect socket when logged out
    if (!user || !threadId || !isAuthenticated) {
      // Clean up socket connection if logged out
      socketService.offNewMessage();
      if (threadId) {
        socketService.leaveRoom(threadId as string);
      }
      return;
    }

    let isMounted = true;

    const setupSocket = async () => {
      try {
        // Connect and wait for connection (will resolve even if server is down)
        await socketService.connect(user.id);

        if (isMounted) {
          // Join thread room after connection (will silently fail if not connected)
          socketService.joinRoom(threadId as string);

          // Listen for new messages
          const handleNewMessage = (message: any) => {
            // De-duplicate messages by _id
            setMessages((prev) => {
              const exists = prev.some((m) => m._id === message._id);
              if (!exists) {
                return [...prev, message];
              }
              return prev;
            });
            // Auto-scroll to bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          };

          socketService.onNewMessage(handleNewMessage);
        }
      } catch (error) {
        // Socket service now resolves gracefully even when server is down
        // No need to show error - app will work without real-time features
        if (__DEV__) {
          console.warn('Socket connection unavailable (server may be down)');
        }
      }
    };

    setupSocket();

    // Cleanup on unmount or logout
    return () => {
      isMounted = false;
      socketService.offNewMessage();
      if (threadId) {
        socketService.leaveRoom(threadId as string);
      }
    };
  }, [user, threadId, isAuthenticated]);

  // Clean up on logout - prevent background fetches and socket connections
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMessages([]);
      socketService.offNewMessage();
      if (threadId) {
        socketService.leaveRoom(threadId as string);
      }
    }
  }, [isAuthenticated, user, threadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || isSending || !threadId || !contactId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      socketService.sendMessage({
        threadId: threadId as string,
        senderId: user!.id,
        receiverId: contactId as string,
        message: messageText,
      });

      // Message will be added via Socket.IO event
      setIsSending(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false);
      throw error;
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isSent = item.senderId === user?.id || item.senderId._id === user?.id;
    const senderName = isSent ? (user?.firstName || '') : (contactName as string);

    // Format timestamp
    const timestamp = moment(item.createdAt).format('h:mm A');

    return (
      <ChatBubble
        message={item.text || item.message}
        isSent={isSent}
        timestamp={timestamp}
        senderName={isSent ? undefined : senderName}
        productThumbnail={item.productImage || null}
      />
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${contactName}? You will no longer receive messages from them.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              if (contactId) {
                await blockUser(contactId as string);
                Alert.alert(
                  'User Blocked',
                  `${contactName} has been blocked.`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const showOptions = () => {
    Alert.alert(
      'Options',
      undefined,
      [
        {
          text: 'Report User',
          onPress: () => setReportModalVisible(true),
        },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: handleBlockUser,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <View style={styles.headerInfo}>
          {productImageUrl && !headerImageError ? (
            <View style={styles.productThumbnail}>
              {headerImageLoading && (
                <View style={styles.productThumbnailLoading}>
                  <ActivityIndicator size="small" color="#4caf50" />
                </View>
              )}
              <Image
                source={{ 
                  uri: productImageUrl,
                }}
                style={styles.productThumbnailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                onLoadStart={() => {
                  setHeaderImageLoading(true);
                  if (__DEV__ && Platform.OS === 'ios') {
                    console.log('🔄 iOS: Starting to load header image:', productImageUrl);
                  }
                }}
                onLoad={() => {
                  setHeaderImageLoading(false);
                  if (__DEV__ && Platform.OS === 'ios') {
                    console.log('✅ iOS: Header image loaded successfully:', productImageUrl);
                  }
                }}
                onError={(error) => {
                  if (__DEV__) {
                    console.error('❌ Chat room header image error:', {
                      platform: Platform.OS,
                      url: productImageUrl,
                      error: error,
                    });
                  }
                  setHeaderImageError(true);
                  setHeaderImageLoading(false);
                }}
                accessibilityLabel="Product image"
              />
            </View>
          ) : productImage ? (
            <View style={styles.productThumbnail}>
              <LinearGradient
                colors={['#9be7ae', '#4caf50']}
                style={styles.productThumbnailGradient}
              >
                <Text style={styles.productThumbnailText}>📦</Text>
              </LinearGradient>
            </View>
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{contactName}</Text>
            {productTitle && (
              <Text style={styles.headerSubtitle}>{productTitle}</Text>
            )}
            )}
          </View>
        </View>
        <Pressable onPress={showOptions} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <LinearGradient
                colors={['#6cc27a', '#4caf50']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>
      </View>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reportedUserId={contactId as string}
        title={`Report ${contactName}`}
      />
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b6b6b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  productThumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  productThumbnailLoading: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  productThumbnailGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productThumbnailText: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    marginTop: 2,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

