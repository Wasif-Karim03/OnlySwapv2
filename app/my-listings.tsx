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

interface Product {
  _id: string;
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category: string;
  status: string;
  leftSwipeCount: number;
  rightSwipeCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMyProducts = async () => {
    try {
      const response = await api.get('/api/products/my/products');
      if (response.data.success && response.data.data) {
        setProducts(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching my products:', error);
      Alert.alert('Error', 'Failed to load your listings. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyProducts();
    }, [])
  );

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.title}"? This will remove it from the marketplace but keep the data for records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(product._id);
            try {
              await api.delete(`/api/products/${product._id}`);
              Alert.alert('Success', 'Product deleted successfully');
              fetchMyProducts(); // Refresh list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsSold = (product: Product) => {
    Alert.alert(
      'Mark as Sold',
      `Mark "${product.title}" as sold? This will remove it from the marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          onPress: async () => {
            setProcessingId(product._id);
            try {
              await api.put(`/api/products/${product._id}/sold`);
              Alert.alert('Success', 'Product marked as sold');
              fetchMyProducts(); // Refresh list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark product as sold');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const getImageUrl = (product: Product): string | null => {
    const imagePath = product.images?.[0] || product.imageUrl;
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const apiBaseUrl = getApiBaseUrl();
    return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const getStatusColor = (status: string, isDeleted: boolean) => {
    if (isDeleted) return '#ef4444'; // Red for deleted
    if (status === 'sold') return '#f59e0b'; // Orange for sold
    return '#4caf50'; // Green for available
  };

  const getStatusText = (status: string, isDeleted: boolean) => {
    if (isDeleted) return 'Deleted';
    if (status === 'sold') return 'Sold';
    return 'Active';
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Fetching your listings...</Text>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrapper}>
            <LinearGradient
              colors={['#bbf7d0', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="layers-outline" size={36} color="#0F172A" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first product to start receiving bids from your community.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/add-product')}
          >
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>List a Product</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.productsGrid}>
        {products.map((product) => {
              const imageUrl = getImageUrl(product);
              const isProcessing = processingId === product._id;
              const statusColor = getStatusColor(product.status, product.isDeleted || false);
              const statusText = getStatusText(product.status, product.isDeleted || false);

          return (
            <View key={product._id} style={styles.productCard}>
              <View style={styles.productMedia}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={36} color="#9be7ae" />
                  </View>
                )}
                <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                  <Ionicons
                    name={
                      product.isDeleted
                        ? 'trash-outline'
                        : product.status === 'sold'
                        ? 'checkmark-circle-outline'
                        : 'flash-outline'
                    }
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusPillText}>{statusText}</Text>
                </View>
              </View>

              <View style={styles.productBody}>
                <View style={styles.productHeader}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                </View>
                <Text style={styles.productMeta}>{product.category}</Text>

                <View style={styles.productFooter}>
                  <View style={styles.statChip}>
                    <Ionicons name="arrow-back-outline" size={14} color="#ef4444" />
                    <Text style={styles.statChipText}>{product.leftSwipeCount || 0} skipped</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Ionicons name="heart-outline" size={14} color="#16a34a" />
                    <Text style={styles.statChipText}>{product.rightSwipeCount || 0} interested</Text>
                  </View>
                </View>

                {!product.isDeleted && product.status === 'available' ? (
                  <View style={styles.productActions}>
                    <Pressable
                      style={[styles.actionChip, styles.actionChipDanger]}
                      onPress={() => handleDelete(product)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.actionChipText}>Delete</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.actionChip, styles.actionChipSuccess]}
                      onPress={() => handleMarkAsSold(product)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.actionChipText}>Mark Sold</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.productInfoBanner}>
                    <Ionicons
                      name={product.isDeleted ? 'trash' : 'checkmark-circle'}
                      size={14}
                      color={statusColor}
                    />
                    <Text style={[styles.productInfoText, { color: statusColor }]}>
                      {product.isDeleted
                        ? `Deleted on ${
                            product.deletedAt
                              ? new Date(product.deletedAt).toLocaleDateString()
                              : 'Unknown'
                          }`
                        : 'This item has been sold'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#bbf7d0', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <Pressable onPress={() => router.back()} style={styles.heroBack}>
            <Ionicons name="chevron-back" size={20} color="#14532D" />
          </Pressable>
          <Text style={styles.heroTitle}>My Listings</Text>
          <Pressable
            style={styles.heroAdd}
            onPress={() => router.push('/add-product')}
          >
            <Ionicons name="add-outline" size={20} color="#14532D" />
          </Pressable>
        </View>
        <Text style={styles.heroSubtitle}>
          Manage everything you’re selling and keep tabs on buyer interest.
        </Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="cube-outline" size={16} color="#14532D" />
            <Text style={styles.heroMetaText}>{products.length} Active Listings</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyProducts} />
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
    backgroundColor: '#F0FDF4',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 28,
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
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAdd: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroSubtitle: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 22,
    color: '#14532D',
  },
  heroMeta: {
    marginTop: 18,
    flexDirection: 'row',
    columnGap: 12,
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
    color: '#14532D',
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 50,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
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
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 10,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
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
  productsGrid: {
    gap: 18,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 8,
  },
  productMedia: {
    position: 'relative',
    height: 220,
    overflow: 'hidden',
    backgroundColor: '#ECFDF5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
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
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  productBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    paddingRight: 12,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22C55E',
  },
  productMeta: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
  },
  statChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionChipDanger: {
    backgroundColor: '#ef4444',
  },
  actionChipSuccess: {
    backgroundColor: '#f59e0b',
  },
  actionChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productInfoBanner: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

