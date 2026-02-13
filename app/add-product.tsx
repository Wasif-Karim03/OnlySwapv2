import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import { uploadMultipleImagesToCloudinary } from '@/services/cloudinaryUpload';

export default function AddProductScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Array<{ uri: string; name: string; type: string }>>([]);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');

  // Simple entrance + button animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(16)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const categories = [
    'Textbooks',
    'Electronics',
    'Clothing',
    'Furniture',
    'Sports Equipment',
    'Other',
  ];

  const getSuggestionsForCategory = (category: string | undefined) => {
    const normalized = (category || '').toLowerCase();

    if (normalized === 'textbooks') {
      return [
        'Used textbook in great condition, no missing pages. Light highlighting on a few chapters.',
        'Perfect for the upcoming semester. Clean copy from a non‑smoker, pet‑free home.',
        'Includes helpful handwritten notes and exam tips from previous semesters.',
      ];
    }

    if (normalized === 'electronics') {
      return [
        'Fully working, well maintained and used mainly for classes and light gaming.',
        'Great sound quality and battery life. Comes with charging cable.',
        'Perfect for dual‑screen study setup. No dead pixels or scratches.',
      ];
    }

    if (normalized === 'clothing') {
      return [
        'Warm and comfortable jacket, worn only a few times. No stains or damage.',
        'Official college hoodie in great condition, perfect for game days.',
        'Clean and ironed, ready to wear for interviews or presentations.',
      ];
    }

    if (normalized === 'furniture') {
      return [
        'Sturdy desk ideal for dorm rooms, includes drawers for extra storage.',
        'Comfortable chair for long study sessions, adjustable height and back.',
        'Compact bookshelf that fits easily in a dorm or apartment.',
      ];
    }

    if (normalized === 'sports equipment') {
      return [
        'Good grip and bounce, perfect for pickup games.',
        'Pair of dumbbells ideal for at‑home workouts.',
        'Clean yoga mat used only a few times, easy to wipe and roll up.',
      ];
    }

    return [
      'Clean and well cared for item, ideal for college life.',
      'Selling because I no longer need it. Works perfectly.',
      'Pickup on campus preferred. Message me if you have any questions.',
    ];
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'title':
        return value.trim() === '' ? 'Title is required' : '';
      case 'description':
        return value.trim() === '' ? 'Description is required' : '';
      case 'price':
        const price = parseFloat(value);
        if (!value.trim()) return 'Price is required';
        if (isNaN(price) || price <= 0) return 'Please enter a valid price';
        return '';
      case 'category':
        if (value === '') return 'Category is required';
        // If "Other" is selected, require a custom category name
        if (value === 'Other' && customCategory.trim() === '') {
          return 'Please enter a category name';
        }
        return '';
      default:
        return '';
    }
  };

  const normalizeAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      let uri = asset.uri;
      const mimeType = asset.mimeType || asset.type || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpeg';
      let name = asset.fileName || `image_${Date.now()}.${extension}`;

      if (!name.includes('.')) {
        name = `${name}.${extension}`;
      }

      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const destPath = `${FileSystem.cacheDirectory ?? ''}${Date.now()}_${name}`;
        await FileSystem.copyAsync({ from: uri, to: destPath });
        uri = destPath;
      }

      return {
        uri,
        name,
        type: mimeType,
      };
    } catch (error) {
      console.error('Error preparing image asset:', error);
      throw error;
    }
  };

  const pickImages = async () => {
    try {
      // Request gallery permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions to add photos.');
        return;
      }

      // Launch image picker - use quality 1.0 for full quality images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1.0, // Full quality (changed from 0.8)
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const selected = await Promise.all(result.assets.map((asset) => normalizeAsset(asset)));

        // Limit to 10 images total
        const currentCount = images.length;
        const remainingSlots = 10 - currentCount;
        if (remainingSlots > 0) {
          const toAdd = selected.slice(0, remainingSlots);
          setImages((prev) => [...prev, ...toAdd]);
          
          if (selected.length > remainingSlots) {
            Alert.alert('Limit Reached', `You can only add ${remainingSlots} more image(s).`);
          }
        } else {
          Alert.alert('Limit Reached', 'You can only add up to 10 images per product.');
        }
      }
    } catch (error: any) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      if (images.length >= 10) {
        Alert.alert('Limit Reached', 'You can only add up to 10 images per product.');
        return;
      }

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera permission to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const normalized = await normalizeAsset(result.assets[0]);
        setImages((prev) => [...prev, normalized]);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Update description suggestions whenever category changes or when the user adds images.
  useEffect(() => {
    const descriptions = getSuggestionsForCategory(formData.category);
    setDescriptionSuggestions(descriptions);
  }, [formData.category, images.length]);

  // Animate form card on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(formTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [formOpacity, formTranslateY]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors = {
      title: validateField('title', formData.title),
      description: validateField('description', formData.description),
      price: validateField('price', formData.price),
      category: validateField('category', formData.category),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (!hasErrors) {
      if (images.length === 0) {
        Alert.alert('Images Required', 'Please add at least one product image.');
        return;
      }

      setIsLoading(true);
      try {
        console.log('📤 Starting product upload with Cloudinary...');
        console.log('📸 Images to upload:', images.length);
        console.log('🌐 API Base URL:', api.defaults.baseURL);
        
        // Validate images
        if (!images || images.length === 0) {
          throw new Error('No images selected');
        }
        
        // Check image URIs
        const imageUris = images.map((img, idx) => {
          if (!img.uri) {
            throw new Error(`Image ${idx + 1} has no URI`);
          }
          return img.uri;
        });
        
        // Step 1: Upload images directly to Cloudinary from client
        console.log('☁️ Step 1: Uploading images to Cloudinary...');
        const cloudName = 'dvvy7afel'; // Your Cloudinary cloud name
        // TODO: Create upload preset in Cloudinary and update this
        // For now, we'll try with a default preset name
        const uploadPreset = 'onlyswap-unsigned'; // Create this in Cloudinary dashboard
        
        let cloudinaryUrls: string[] = [];
        try {
          const uploadResults = await uploadMultipleImagesToCloudinary(
            imageUris,
            cloudName,
            uploadPreset
          );
          cloudinaryUrls = uploadResults.map(result => result.url);
          console.log(`✅ All ${cloudinaryUrls.length} images uploaded to Cloudinary`);
          console.log('☁️ Cloudinary URLs:', cloudinaryUrls);
        } catch (cloudinaryError: any) {
          console.error('❌ Cloudinary upload failed:', cloudinaryError);
          throw new Error(`Failed to upload images to Cloudinary: ${cloudinaryError.message}`);
        }
        
        // Step 2: Send product data with Cloudinary URLs to server (JSON, not FormData)
        console.log('📤 Step 2: Sending product data to server...');
        const productData = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          // Use custom category text when "Other" is selected
          category: formData.category === 'Other' ? customCategory.trim() : formData.category,
          university: user?.university || '',
          images: cloudinaryUrls, // Send Cloudinary URLs instead of files
        };
        
        console.log('📤 Product data:', {
          title: productData.title,
          category: productData.category,
          imageCount: productData.images.length,
        });
        
        const response = await api.post('/api/products', productData);
        console.log('✅ Product created successfully:', response.data);

        if (response.data.success) {
          Alert.alert(
            'Success!',
            'Your product has been listed successfully!',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          throw new Error(response.data.message || 'Failed to create product');
        }
      } catch (error: any) {
        console.error('❌ Error creating product:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          code: error?.code,
          response: error?.response?.data,
          status: error?.response?.status,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            baseURL: error?.config?.baseURL,
          },
        });
        
        // Show more detailed error message
        let errorMessage = error?.message || 'Failed to create product. Please try again.';
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        } else if (error?.code === 'ETIMEDOUT') {
          errorMessage = 'Upload timed out. Please try again with smaller images or check your connection.';
        }
        
        Alert.alert(
          'Error',
          errorMessage
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>List Product</Text>
            <Text style={styles.headerSubtitle}>Create a clean, attractive post buyers will trust.</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            },
          ]}
        >
          <View style={styles.form}>
          {/* Images come first so the user is prompted to add photos before details */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Product Images</Text>
            </View>
            {images.length > 0 && (
              <Text style={styles.smallMutedText}>{images.length}/10 photos added</Text>
            )}
            <View style={styles.imagePickerContainer}>
              {images.length > 0 && (
                <FlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                      <Pressable
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </Pressable>
                    </View>
                  )}
                  contentContainerStyle={styles.imageList}
                />
              )}
              <Pressable
                style={[
                  styles.pickImageButton,
                  images.length >= 10 && styles.pickImageButtonDisabled,
                ]}
                onPress={takePhoto}
                disabled={images.length >= 10}
              >
                <LinearGradient
                  colors={images.length >= 10 ? ['#D1D5DB', '#9CA3AF'] : ['#9be7ae', '#4caf50']}
                  style={styles.pickImageButtonGradient}
                >
                  <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.pickImageButtonText}>
                    {images.length === 0 ? 'Take Photo' : 'Take Another Photo'}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={[
                  styles.pickImageButton,
                  { marginTop: 10 },
                  images.length >= 10 && styles.pickImageButtonDisabled,
                ]}
                onPress={pickImages}
                disabled={images.length >= 10}
              >
                <LinearGradient
                  colors={images.length >= 10 ? ['#D1D5DB', '#9CA3AF'] : ['#60A5FA', '#3B82F6']}
                  style={styles.pickImageButtonGradient}
                >
                  <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.pickImageButtonText}>
                    {images.length === 0 ? 'Choose from Gallery' : 'Add From Gallery'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
            {images.length === 0 && (
              <Text style={styles.hintText}>Add at least one image of your product</Text>
            )}
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Product Title</Text>
            </View>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={formData.title}
              onChangeText={(text) => {
                setFormData({ ...formData, title: text });
                setErrors({ ...errors, title: '' });
              }}
              placeholder="e.g., Calculus Textbook"
              placeholderTextColor="#aaa"
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>
          {/* Price */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Price</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.priceInput, errors.price ? styles.inputError : null]}
                value={formData.price}
                onChangeText={(text) => {
                  setFormData({ ...formData, price: text });
                  setErrors({ ...errors, price: '' });
                }}
                placeholder="0.00"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
              />
            </View>
            {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>Category</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    setFormData({ ...formData, category });
                    // Reset custom category input when switching away from "Other"
                    if (category !== 'Other') {
                      setCustomCategory('');
                    }
                    setErrors({ ...errors, category: '' });
                  }}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      formData.category === category && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {formData.category === 'Other' && (
              <View style={styles.customCategoryContainer}>
                <Text style={styles.customCategoryLabel}>Write your category</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.customCategoryInput,
                    errors.category ? styles.inputError : null,
                  ]}
                  value={customCategory}
                  onChangeText={(text) => {
                    setCustomCategory(text);
                    // Clear category error once user starts typing
                    if (errors.category) {
                      setErrors({ ...errors, category: '' });
                    }
                  }}
                  placeholder="e.g., Musical Instrument, Lab Equipment..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, errors.description ? styles.inputError : null]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                setErrors({ ...errors, description: '' });
              }}
              placeholder="Tell us about your product..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {descriptionSuggestions.length > 0 && (
              <View style={styles.descriptionSuggestionsContainer}>
                <Text style={styles.suggestionSectionLabel}>Quick description ideas</Text>
                {descriptionSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.descriptionSuggestionBox}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        description: suggestion,
                      });
                      setErrors({ ...errors, description: '' });
                    }}
                  >
                    <Text style={styles.descriptionSuggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            onPressIn={() => {
              Animated.spring(submitScale, {
                toValue: 0.96,
                useNativeDriver: true,
                friction: 6,
                tension: 120,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(submitScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,
                tension: 120,
              }).start();
            }}
            disabled={isLoading}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>List Product</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  form: {
    paddingBottom: 4,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  smallMutedText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  textArea: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4caf50',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 0,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#22C55E',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  categoryChipTextActive: {
    color: '#4caf50',
  },
  customCategoryContainer: {
    marginTop: 12,
  },
  customCategoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  customCategoryInput: {
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    width: '100%',
    marginTop: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  imagePickerContainer: {
    marginTop: 8,
  },
  imageList: {
    paddingRight: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickImageButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pickImageButtonDisabled: {
    opacity: 0.5,
  },
  pickImageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  pickImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#6b6b6b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  descriptionSuggestionsContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  descriptionSuggestionBox: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 6,
  },
  descriptionSuggestionText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
});

