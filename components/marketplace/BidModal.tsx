import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface BidModalProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    image?: string;
  } | null;
  onSubmitBid: (amount: number) => Promise<void>;
}

export const BidModal: React.FC<BidModalProps> = ({ visible, onClose, product, onSubmitBid }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!product) return;
    
    const amount = parseFloat(bidAmount);
    
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount.');
      return;
    }

    if (amount < product.price * 0.5) {
      Alert.alert('Low Bid', `Your bid must be at least 50% of the asking price ($${product.price * 0.5}).`);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmitBid(amount);
      setBidAmount('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit bid. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no product
  if (!product) {
    return null;
  }

  return (
    <Modal
      visible={visible && !!product}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Pressable 
          style={styles.overlay}
          onPress={onClose}
        >
          <Pressable onPress={() => {}}>
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Product Image */}
                {product.image ? (
                  <View style={styles.imageWrapper}>
                    <LinearGradient
                      colors={['#9be7ae', '#4caf50']}
                      style={styles.imageGradient}
                    >
                      <Text style={styles.productTitleText}>{product.title}</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={60} color="#4caf50" />
                  </View>
                )}

                {/* Bid Form */}
                <View style={styles.formContainer}>
                  <Text style={styles.label}>Enter Your Bid</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={bidAmount}
                      onChangeText={setBidAmount}
                      placeholder="0.00"
                      placeholderTextColor="#999"
                      keyboardType="decimal-pad"
                      autoFocus={Platform.OS === 'android'} // Auto-focus on Android only to avoid keyboard issues on iOS
                      returnKeyType="done"
                    />
                  </View>
                  <Text style={styles.hint}>Asking price: ${product.price}</Text>

                  {/* Action Buttons */}
                  <View style={styles.buttonContainer}>
                    <Pressable
                      onPress={onClose}
                      disabled={isLoading}
                      style={[styles.button, styles.cancelButton]}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSubmit}
                      disabled={isLoading || !bidAmount}
                      style={[styles.button, styles.submitButton, (!bidAmount || isLoading) && styles.submitButtonDisabled]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <LinearGradient
                          colors={['#6cc27a', '#4caf50']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.submitButtonGradient}
                        >
                          <Text style={styles.submitButtonText}>Submit Bid</Text>
                        </LinearGradient>
                      )}
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: Platform.OS === 'ios' ? '85%' : '70%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  imageWrapper: {
    height: 120,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  imageGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#f7fdf9',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  formContainer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4caf50',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 16,
  },
  hint: {
    fontSize: 14,
    color: '#6b6b6b',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6b6b6b',
  },
  submitButton: {
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

