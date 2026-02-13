import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/context/UserContext';
import { updateProfile } from '@/services/authService_backend';
import { getApiBaseUrl } from '@/services/apiConfig';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser, loadUser } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profilePicture, setProfilePicture] = useState<{ uri: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      // Set existing profile picture if available
      if (user.profilePicture) {
        const apiBaseUrl = getApiBaseUrl();
        const fullImageUrl = user.profilePicture.startsWith('http')
          ? user.profilePicture
          : `${apiBaseUrl}${user.profilePicture}`;
        setProfilePicture({ uri: fullImageUrl });
      }
    }
  }, [user]);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        return value.trim() === '' ? 'First name is required' : '';
      case 'lastName':
        return value.trim() === '' ? 'Last name is required' : '';
      default:
        return '';
    }
  };

  const pickProfilePicture = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions to add a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture({ uri: result.assets[0].uri });
        setErrors({ ...errors, firstName: '', lastName: '' });
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    const newErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== '');

    if (!hasErrors) {
      setIsLoading(true);
      try {
        // Only send changed values
        const updatedFirstName = firstName.trim() !== (user?.firstName || '') ? firstName.trim() : undefined;
        const updatedLastName = lastName.trim() !== (user?.lastName || '') ? lastName.trim() : undefined;
        
        await updateProfile(
          updatedFirstName,
          updatedLastName,
          profilePicture?.uri
        );

        // Reload user data to get updated profile
        await loadUser();

        Alert.alert(
          'Success!',
          'Your profile has been updated successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error: any) {
        // Error is already logged by API interceptor, just show user-friendly message
        Alert.alert(
          'Error',
          error?.message || 'Failed to update profile. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get profile picture display URI
  const getProfilePictureUri = () => {
    if (profilePicture) {
      return profilePicture.uri;
    }
    if (user?.profilePicture) {
      const apiBaseUrl = getApiBaseUrl();
      return user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `${apiBaseUrl}${user.profilePicture}`;
    }
    return null;
  };

  // Get initials for fallback
  const getInitials = () => {
    const firstInitial = firstName.charAt(0).toUpperCase() || user?.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName.charAt(0).toUpperCase() || user?.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const renderForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Basic Information</Text>
      <Text style={styles.cardSubtitle}>
        Update the details other students see in chats and on your listings.
      </Text>

      <View style={styles.formBody}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <View style={[styles.inputWrapper, errors.firstName && styles.inputWrapperError]}>
            <Ionicons
              name="person-outline"
              size={18}
              color={errors.firstName ? '#ef4444' : '#22C55E'}
            />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setErrors({ ...errors, firstName: '' });
              }}
              placeholder="Enter your first name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <View style={[styles.inputWrapper, errors.lastName && styles.inputWrapperError]}>
            <Ionicons
              name="person-outline"
              size={18}
              color={errors.lastName ? '#ef4444' : '#22C55E'}
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setErrors({ ...errors, lastName: '' });
              }}
              placeholder="Enter your last name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <Ionicons name="mail-outline" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.hintText}>Email cannot be changed</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>University</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <Ionicons name="school-outline" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.university || ''}
              editable={false}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.hintText}>University cannot be changed</Text>
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#D1D5DB', '#9CA3AF'] : ['#9be7ae', '#4caf50']}
          style={styles.submitButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#DCFCE7', '#A7F3D0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <Pressable onPress={() => router.back()} style={styles.heroBackButton}>
            <Ionicons name="chevron-back" size={20} color="#064E3B" />
          </Pressable>
          <Text style={styles.heroTitle}>Edit Profile</Text>
          <View style={styles.heroSpacer} />
        </View>

      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarCard}>
          <Text style={styles.cardTitle}>Profile Photo</Text>
          <Text style={styles.cardSubtitle}>
            A friendly, clear photo helps others feel confident connecting with you.
          </Text>

          <View style={styles.avatarBody}>
            {getProfilePictureUri() ? (
              <Image source={{ uri: getProfilePictureUri()! }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#86efac', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>{getInitials() || '☺︎'}</Text>
              </LinearGradient>
            )}
            <Pressable style={styles.avatarButton} onPress={pickProfilePicture}>
              <LinearGradient
                colors={['#6cc27a', '#4caf50']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarButtonGradient}
              >
                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>
                  {getProfilePictureUri() ? 'Change picture' : 'Upload picture'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {renderForm()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 24,
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBackButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
  },
  heroSpacer: {
    width: 42,
  },
  heroSubtitle: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#065F46',
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
    gap: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  avatarBody: {
    marginTop: 20,
    alignItems: 'center',
    gap: 18,
  },
  avatarImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  avatarPlaceholder: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarButton: {
    width: '100%',
  },
  avatarButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formBody: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  inputDisabled: {
    color: '#64748B',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

