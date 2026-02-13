import { ReportModal } from '@/components/ReportModal';
import { getApiBaseUrl } from '@/services/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image?: string;
    images?: string[];
    university: string;
    sellerName: string;
    description?: string;
  };
}

// Helper to get full image URL from relative path or full URL
// Handles Cloudinary URLs, local paths, and full URLs
const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;

  // If it's already a full URL (http:// or https://), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Check if it's a Cloudinary URL path (without protocol)
  // Cloudinary paths look like: dvvy7afel/image/upload/v1767754356/onlyswap/products/...
  // or: res.cloudinary.com/dvvy7afel/image/upload/...
  if (imagePath.includes('cloudinary.com') ||
    (imagePath.includes('/image/upload/') && !imagePath.startsWith('/'))) {
    // It's a Cloudinary URL - construct full Cloudinary URL
    // If it starts with res.cloudinary.com, add https://
    if (imagePath.startsWith('res.cloudinary.com')) {
      return `https://${imagePath}`;
    }
    // Otherwise, it's just the path part - extract cloud name and construct URL
    // Path format: dvvy7afel/image/upload/v1767754356/onlyswap/products/...
    const parts = imagePath.split('/');
    if (parts.length >= 3 && parts[1] === 'image' && parts[2] === 'upload') {
      // Extract cloud name (first part)
      const cloudName = parts[0];
      // Rest is the path
      const path = parts.slice(1).join('/');
      return `https://res.cloudinary.com/${cloudName}/${path}`;
    }
    // Fallback: assume it's a full Cloudinary path
    return `https://res.cloudinary.com/${imagePath}`;
  }

  // It's a local path - construct URL using API base URL
  let path = '';
  if (imagePath.startsWith('/')) {
    // Already a relative path
    path = imagePath;
  } else {
    // Missing leading /, add it
    path = `/${imagePath}`;
  }

  // Construct full URL using current device's API base URL
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = `${apiBaseUrl}${path}`;
  return fullUrl;
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Map<number, boolean>>(new Map());
  const [imageLoading, setImageLoading] = useState<Map<number, boolean>>(new Map());
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get image array: prioritize images array, fallback to image
  const rawImagePaths = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  // Convert all image paths to full URLs using current device's API base URL
  const imageUrls = rawImagePaths
    .map((path) => getImageUrl(path))
    .filter((url): url is string => url !== null);

  const handleScroll = (event: any) => {
    const slideSize = CARD_WIDTH;
    const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(currentIndex);
  };

  const handleImageError = (index: number, url: string) => {
    if (__DEV__) {
      console.error(`❌ Image ${index} failed to load:`, url);
    }
    setImageErrors((prev) => new Map(prev).set(index, true));
    setImageLoading((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  };

  const handleImageLoad = (index: number, url: string) => {
    setImageLoading((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  };

  const handleImageLoadStart = (index: number) => {
    setImageLoading((prev) => new Map(prev).set(index, true));
    setImageErrors((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => {
    const hasError = imageErrors.get(index) || false;
    const isLoading = imageLoading.get(index) || false;

    if (hasError) {
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={80} color="#9be7ae" />
          <Text style={styles.errorText}>Image unavailable</Text>
          <Text style={styles.errorUrl} numberOfLines={1}>{item}</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageWrapper}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        )}
        <Image
          source={{
            uri: item,
            cache: 'force-cache', // Try cached first, then reload if needed
          }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => handleImageLoadStart(index)}
          onLoad={() => handleImageLoad(index, item)}
          onError={(error) => {
            if (__DEV__) {
              console.error(`❌ Image error for ${index}:`, item);
            }
            handleImageError(index, item);
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Product Images */}
      <View style={styles.imageContainer}>
        {imageUrls.length > 0 ? (
          <>
            <FlatList
              ref={flatListRef}
              data={imageUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `img-${index}-${item}`}
              renderItem={renderImageItem}
            />
            {/* Image indicators */}
            {imageUrls.length > 1 && (
              <View style={styles.indicatorContainer}>
                {imageUrls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
            {/* Image counter */}
            {imageUrls.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {imageUrls.length}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#22C55E" />
            <Text style={styles.placeholderText}>No image available</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />
      </View>

      {/* Product Info Overlay */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.price}>${product.price}</Text>
          <View style={styles.universityBadge}>
            <Ionicons name="school-outline" size={14} color="#FFFFFF" />
            <Text style={styles.universityText}>{product.university}</Text>
          </View>
        </View>

        <Text style={styles.title}>{product.title}</Text>

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.sellerRow}>
          <Ionicons name="person-outline" size={14} color="#DCFCE7" />
          <Text style={styles.sellerText}>{product.sellerName}</Text>
        </View>

        {/* Report Button */}
        <Pressable
          style={styles.reportButton}
          onPress={() => setReportModalVisible(true)}
          hitSlop={10}
        >
          <Ionicons name="flag-outline" size={16} color="#EF4444" />
          <Text style={styles.reportText}>Report</Text>
        </Pressable>
      </View>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reportedProductId={product.id}
        title="Report Product"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    height: height * 0.65,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(220, 252, 231, 0.3)',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0FDF4',
  },
  imageWrapper: {
    width: CARD_WIDTH,
    height: '100%',
    position: 'relative',
    backgroundColor: '#F0FDF4',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0FDF4',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 253, 244, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  errorUrl: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  universityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  universityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sellerText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  reportButton: {
    position: 'absolute',
    bottom: 24, // Align with bottom padding of container
    right: 24,  // Align with right padding of container
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  reportText: {
    color: '#EF4444', // Red text
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 2,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
