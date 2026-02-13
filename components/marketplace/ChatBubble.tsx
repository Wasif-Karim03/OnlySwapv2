import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiBaseUrl } from '@/services/apiConfig';

interface ChatBubbleProps {
  message: string;
  isSent: boolean;
  timestamp: string;
  senderName?: string;
  productThumbnail?: string;
}

// Helper to get full image URL from relative path or full URL
// iOS requires HTTPS URLs, so we ensure all URLs are HTTPS
const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL, ensure it's HTTPS (iOS requires HTTPS)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Convert HTTP to HTTPS for iOS compatibility
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
  // Ensure HTTPS for iOS
  const url = `${apiBaseUrl}${path}`;
  if (url.startsWith('http://') && Platform.OS === 'ios') {
    return url.replace('http://', 'https://');
  }
  return url;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isSent, 
  timestamp,
  senderName,
  productThumbnail 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = productThumbnail ? getImageUrl(productThumbnail) : null;
  
  return (
    <View style={styles.container}>
      <View style={[styles.bubbleWrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}>
        {/* Product Image - Show first, then text below */}
        {imageUrl && (
          <View style={styles.productThumbnailContainer}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color="#4caf50" />
              </View>
            )}
            {!imageError ? (
              <Image
                source={{ 
                  uri: imageUrl,
                }}
                style={styles.productThumbnailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                onLoadStart={() => {
                  setImageLoading(true);
                  if (__DEV__ && Platform.OS === 'ios') {
                    console.log('🔄 iOS: Starting to load image:', imageUrl);
                  }
                }}
                onLoad={() => {
                  setImageLoading(false);
                  if (__DEV__ && Platform.OS === 'ios') {
                    console.log('✅ iOS: Image loaded successfully:', imageUrl);
                  }
                }}
                onError={(error) => {
                  if (__DEV__) {
                    console.error('❌ ChatBubble image error:', {
                      platform: Platform.OS,
                      url: imageUrl,
                      error: error,
                    });
                  }
                  setImageError(true);
                  setImageLoading(false);
                }}
                accessibilityLabel="Product image"
              />
            ) : (
              <View style={styles.productThumbnailFallback}>
                <Text style={styles.productThumbnailText}>📦</Text>
              </View>
            )}
          </View>
        )}
        {!isSent && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isSent ? styles.sentBubble : styles.receivedBubble,
          ]}
        >
          {isSent ? (
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sentBubbleGradient}
            >
              <Text style={styles.sentText}>{message}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.receivedText}>{message}</Text>
          )}
        </View>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  bubbleWrapper: {
    maxWidth: '80%',
  },
  sentWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  productThumbnailContainer: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  productThumbnailImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageLoadingContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  productThumbnailFallback: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productThumbnailText: {
    fontSize: 32,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderBottomLeftRadius: 4,
  },
  sentBubbleGradient: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sentText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  receivedText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});

