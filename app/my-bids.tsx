import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import { getApiBaseUrl } from '@/services/apiConfig';

interface Bid {
  _id: string;
  productId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    images?: string[];
    status: string;
    category: string;
  };
  sellerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  createdAt: string;
}

export default function MyBidsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productHighestBids, setProductHighestBids] = useState<Record<string, number>>({});

  const fetchMyBids = async () => {
    try {
      const response = await api.get('/api/bids/my/bids');
      if (response.data.success && response.data.data) {
        setBids(response.data.data);
        
        // Fetch highest bid for each product to show comparison
        const highestBidsMap: Record<string, number> = {};
        for (const bid of response.data.data) {
          try {
            const bidsResponse = await api.get(`/api/bids/product/${bid.productId._id}`);
            if (bidsResponse.data.success && bidsResponse.data.data) {
              const productBids = bidsResponse.data.data;
              const highest = Math.max(...productBids.map((b: any) => b.amount));
              highestBidsMap[bid.productId._id] = highest;
            }
          } catch (error) {
            // Silent fail for individual product bid fetching
          }
        }
        setProductHighestBids(highestBidsMap);
      }
    } catch (error: any) {
      console.error('Error fetching my bids:', error);
      Alert.alert('Error', 'Failed to load your bids. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyBids();
    }, [])
  );

  const getImageUrl = (product: Bid['productId']): string | null => {
    const imagePath = product.images?.[0] || product.imageUrl;
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const apiBaseUrl = getApiBaseUrl();
    return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'sold') return '#f59e0b';
    if (status === 'pending') return '#6b6b6b';
    return '#4caf50';
  };

  const getStatusText = (status: string) => {
    if (status === 'sold') return 'Sold';
    if (status === 'pending') return 'Pending';
    return 'Available';
  };

  const handleProductPress = async (productId: string, sellerId: string) => {
    try {
      // Get or create thread for this product
      const response = await api.get(`/api/chats/product/${productId}/thread`);
      if (response.data.success && response.data.data) {
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
      }
    } catch (error: any) {
      console.error('Error getting thread:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Gathering your bids...</Text>
        </View>
      );
    }

    if (bids.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <LinearGradient
            colors={['#fde68a', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="sparkles-outline" size={36} color="#78350f" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No bids yet</Text>
          <Text style={styles.emptySubtitle}>
            Swipe right on marketplace listings to start bidding and connecting with sellers.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/index')}
          >
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Explore Marketplace</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cards}>
        {bids.map((bid) => {
              const imageUrl = getImageUrl(bid.productId);
              const statusColor = getStatusColor(bid.productId.status);
              const statusText = getStatusText(bid.productId.status);
              const highestBid = productHighestBids[bid.productId._id];
              const isHighest = highestBid ? bid.amount >= highestBid : false;

          return (
            <Pressable
              key={bid._id}
              style={styles.card}
              onPress={() => handleProductPress(bid.productId._id, bid.sellerId._id)}
            >
              <View style={styles.cardMedia}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="image-outline" size={36} color="#9be7ae" />
                  </View>
                )}
                <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
                  <Ionicons
                    name={
                      bid.productId.status === 'sold'
                        ? 'checkmark-circle-outline'
                        : 'time-outline'
                    }
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusChipText}>{statusText}</Text>
                </View>
                {isHighest && bid.productId.status === 'available' && (
                  <View style={styles.highlightChip}>
                    <Ionicons name="trophy" size={14} color="#713F12" />
                    <Text style={styles.highlightChipText}>Top Bidder</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{bid.productId.title}</Text>
                  <Text style={styles.cardCategory}>{bid.productId.category}</Text>
                </View>

                <View style={styles.bidSummary}>
                  <View style={styles.bidDetail}>
                    <Text style={styles.bidDetailLabel}>Your Bid</Text>
                    <Text style={styles.bidDetailValue}>${bid.amount}</Text>
                  </View>
                  <View style={styles.bidDetail}>
                    <Text style={styles.bidDetailLabel}>Asking Price</Text>
                    <Text style={styles.bidDetailValueMuted}>${bid.productId.price}</Text>
                  </View>
                  {highestBid && !isHighest && (
                    <View style={styles.bidDetail}>
                      <Text style={styles.bidDetailLabel}>Current Highest</Text>
                      <Text style={styles.bidDetailValueAlert}>${highestBid}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="person-outline" size={12} color="#6B7280" />
                    <Text style={styles.metaChipText}>
                      {bid.sellerId.firstName} {bid.sellerId.lastName}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={styles.metaChipText}>
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.ctaButton}
                  onPress={() => handleProductPress(bid.productId._id, bid.sellerId._id)}
                >
                  <LinearGradient
                    colors={['#6cc27a', '#4caf50']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaGradient}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.ctaText}>
                      {bid.productId.status === 'available' ? 'Message Seller' : 'View Chat'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#fef3c7', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <Pressable onPress={() => router.back()} style={styles.heroBack}>
            <Ionicons name="chevron-back" size={20} color="#7C2D12" />
          </Pressable>
          <Text style={styles.heroTitle}>My Bids</Text>
          <View style={styles.heroSpacer} />
        </View>
        <Text style={styles.heroSubtitle}>
          Track every offer you’ve made and jump back into conversations instantly.
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="pricetag-outline" size={16} color="#7C2D12" />
            <Text style={styles.heroMetaText}>{bids.length} Active Bids</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyBids} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBack: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSpacer: {
    width: 42,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#7C2D12',
  },
  heroSubtitle: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#7C2D12',
  },
  heroMeta: {
    marginTop: 18,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  heroMetaText: {
    color: '#7C2D12',
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loadingOverlay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 44,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  emptyIconGradient: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7C2D12',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9A3412',
    textAlign: 'center',
    marginBottom: 26,
  },
  emptyButton: {
    width: '100%',
  },
  emptyButtonGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cards: {
    gap: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardMedia: {
    position: 'relative',
    height: 210,
    backgroundColor: '#FFF7ED',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    position: 'absolute',
    right: 16,
    top: 16,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightChip: {
    position: 'absolute',
    left: 16,
    top: 16,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(254, 243, 199, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightChipText: {
    color: '#713F12',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: '#9A3412',
    fontWeight: '600',
  },
  bidSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bidDetail: {
    flex: 1,
    marginRight: 12,
  },
  bidDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  bidDetailValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22C55E',
  },
  bidDetailValueMuted: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  bidDetailValueAlert: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  metaChipText: {
    fontSize: 12,
    color: '#7C2D12',
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: 6,
  },
  ctaGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

