import { BidModal } from '@/components/marketplace/BidModal';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const router = useRouter();
  const swipeRef = useRef<any>(null);
  const { isSellerMode, setIsSellerMode, user, isAuthenticated } = useUser();
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const toggleOpacity = useSharedValue(0);
  const toggleScale = useSharedValue(0.9);
  const emptyStateOpacity = useSharedValue(0);
  const emptyStateScale = useSharedValue(0.9);
  const addButtonScale = useSharedValue(1);

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

    // Toggle animation
    toggleOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    toggleScale.value = withDelay(150, withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    }));

    // Empty state animation
    if (products.length === 0 && !isLoadingProducts) {
      emptyStateOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
      emptyStateScale.value = withDelay(300, withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      }));
    }
  }, [products.length, isLoadingProducts]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const toggleStyle = useAnimatedStyle(() => ({
    opacity: toggleOpacity.value,
    transform: [{ scale: toggleScale.value }],
  }));

  const emptyStateStyle = useAnimatedStyle(() => ({
    opacity: emptyStateOpacity.value,
    transform: [{ scale: emptyStateScale.value }],
  }));

  const addButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const AnimatedView = Animated.View;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  // Fetch products from API
  const fetchProducts = async () => {
    if (!isAuthenticated || !user) {
      setProducts([]);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const excludeSellerId = !isSellerMode && user.id ? user.id : undefined;
      console.log('🔍 Fetching products with filters:', { 
        isSellerMode, 
        excludeSellerId 
        // Note: university is automatically filtered by backend based on authenticated user
      });
      
      const response = await api.get('/api/products', {
        params: {
          status: 'available',
          // university is now automatically filtered by backend based on authenticated user
          excludeSeller: excludeSellerId, // In buyer mode, exclude own products
          excludeBidProducts: !isSellerMode, // In buyer mode, hide items user has already bid on
          limit: 100, // Increase limit to show more products
          page: 1,
        },
      });
      
      if (response.data.success && response.data.data) {
        // Transform API response to match ProductCard interface
        // ProductCard component will handle URL conversion from relative paths
        const transformedProducts = response.data.data.map((product: any) => ({
          id: product._id,
          _id: product._id,
          title: product.title,
          price: product.price,
          image: product.imageUrl || null, // Can be relative path or full URL
          images: product.images || [], // Can be relative paths or full URLs
          university: product.university,
          description: product.description,
          sellerName: product.sellerId 
            ? `${product.sellerId.firstName} ${product.sellerId.lastName}`
            : 'Unknown Seller',
          sellerId: product.sellerId?._id || product.sellerId,
        }));
        console.log('✅ Products loaded:', transformedProducts.length);
        console.log('📊 Pagination info:', response.data.pagination);
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch products on mount and when authenticated or mode changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.university, isSellerMode]);

  // Clean up on logout - prevent background fetches when not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProducts([]);
      setBidModalVisible(false);
    }
  }, [isAuthenticated, user]);

  const handleSwipeRight = async (cardIndex: number) => {
    if (products[cardIndex]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Track right swipe (interested)
      try {
        await api.post('/api/products/track-swipe', {
          productId: products[cardIndex].id,
          swipeType: 'right',
        });
      } catch (error) {
        // Silent fail - don't block user experience if tracking fails
        if (__DEV__) {
          console.warn('Failed to track right swipe:', error);
        }
      }

      setSelectedProduct(products[cardIndex]);
      setBidModalVisible(true);
    }
  };

  const handleSwipeLeft = async (cardIndex: number) => {
    if (products[cardIndex]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Track left swipe (skip)
      try {
        await api.post('/api/products/track-swipe', {
          productId: products[cardIndex].id,
          swipeType: 'left',
        });
      } catch (error) {
        // Silent fail - don't block user experience if tracking fails
        if (__DEV__) {
          console.warn('Failed to track left swipe:', error);
        }
      }
    }
  };

  const handleSubmitBid = async (amount: number) => {
    setIsSubmittingBid(true);
    try {
      console.log('Submitting bid:', { productId: selectedProduct.id, amount });
      
      const response = await api.post('/api/bids', {
        productId: selectedProduct.id,
        amount,
      });
      
      if (response.data.success && response.data.threadId) {
        console.log('✅ Bid submitted, threadId:', response.data.threadId);
        
        // Navigate to chat room with threadId
        router.push({
          pathname: '/chat-room',
          params: {
            threadId: response.data.threadId,
            contactName: selectedProduct.sellerName,
            contactId: selectedProduct.sellerId || 'seller',
            productTitle: selectedProduct.title,
            productImage: selectedProduct.image,
            autoMessage: JSON.stringify(response.data.message),
          },
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit bid');
      }
    } catch (error: any) {
      console.error('Bid submission error:', error);
      setIsSubmittingBid(false);
      throw error; // Let BidModal handle the error display
    }
  };

  const handleOnSwipedAllCards = () => {
    Alert.alert(
      'All Caught Up!',
      "You've viewed all available products. Check back later for more!",
      [
        {
          text: 'Refresh',
          onPress: () => {
            fetchProducts();
          },
        },
      ]
    );
  };

  const renderCard = (product: any, cardIndex: number) => {
    return <ProductCard key={product._id || product.id} product={product} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header with Mode Toggle */}
        <AnimatedView style={[styles.header, headerStyle]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo} numberOfLines={1} adjustsFontSizeToFit={false}>
              OnlySwap
            </Text>
          </View>
          <View style={styles.rightHeaderContainer}>
            <AnimatedView style={[styles.toggleContainer, toggleStyle]}>
              <Text style={[styles.toggleLabel, !isSellerMode && styles.toggleLabelActive]}>
                Buyer
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSellerMode(!isSellerMode);
                }}
              >
                <Switch
                  value={isSellerMode}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsSellerMode(value);
                  }}
                  trackColor={{ false: 'rgba(220, 252, 231, 0.6)', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="rgba(220, 252, 231, 0.6)"
                />
              </Pressable>
              <Text style={[styles.toggleLabel, isSellerMode && styles.toggleLabelActive]}>
                Seller
              </Text>
            </AnimatedView>
            {isSellerMode && (
              <AnimatedPressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  addButtonScale.value = withSpring(0.9, {
                    damping: 10,
                    stiffness: 300,
                  }, () => {
                    addButtonScale.value = withSpring(1, {
                      damping: 10,
                      stiffness: 300,
                    });
                  });
                  router.push('/add-product');
                }}
                style={[styles.addButton, addButtonStyle]}
              >
                <LinearGradient
                  colors={['#3BB75E', '#2CA654']}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </LinearGradient>
              </AnimatedPressable>
            )}
          </View>
        </AnimatedView>

        {/* Swipe Deck */}
        {!isSellerMode ? (
          <View style={styles.swipeContainer}>
            {isLoadingProducts ? (
              <AnimatedView style={[styles.emptyState, emptyStateStyle]}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.emptyStateSubtext}>Loading products...</Text>
              </AnimatedView>
            ) : products.length > 0 ? (
              <DeckSwiper
                ref={swipeRef}
                cards={products}
                renderCard={renderCard}
                onSwipedRight={handleSwipeRight}
                onSwipedLeft={handleSwipeLeft}
                onSwipedAll={handleOnSwipedAllCards}
                cardIndex={0}
                backgroundColor="transparent"
                stackSize={3}
                stackSeparation={8}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeAnimationDuration={350}
                disableBottomSwipe
                disableTopSwipe
              />
            ) : (
              <AnimatedView style={[styles.emptyState, emptyStateStyle]}>
                <Ionicons name="gift-outline" size={80} color="#22C55E" />
                <Text style={styles.emptyStateText}>No products available</Text>
                <Text style={styles.emptyStateSubtext}>Check back later!</Text>
              </AnimatedView>
            )}
          </View>
        ) : (
          <View style={styles.sellerView}>
            <AnimatedView style={[styles.emptyState, emptyStateStyle]}>
              <Ionicons name="storefront-outline" size={80} color="#22C55E" />
              <Text style={styles.emptyStateText}>Seller Mode</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to list your first product
              </Text>
            </AnimatedView>
          </View>
        )}
      </LinearGradient>

      {/* Bid Modal */}
      <BidModal
        visible={bidModalVisible}
        onClose={() => setBidModalVisible(false)}
        product={selectedProduct}
        onSubmitBid={handleSubmitBid}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 252, 231, 0.3)',
  },
  logoContainer: {
    flexShrink: 1,
    flex: 1,
    marginRight: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#14532D',
    letterSpacing: -0.5,
  },
  rightHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.5)',
    flexShrink: 0,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  toggleLabelActive: {
    color: '#22C55E',
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexShrink: 0,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  sellerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 26,
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
