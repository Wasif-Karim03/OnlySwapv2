import { useUser } from '@/context/UserContext';
import api from '@/services/api';
import {
    loadSettings,
    saveSettings,
    updateSetting,
} from '@/services/settingsService';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isSellerMode, setIsSellerMode, logout } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [bidNotifications, setBidNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await loadSettings();
        setNotificationsEnabled(settings.notificationsEnabled);
        setBidNotifications(settings.bidNotifications);
        setMessageNotifications(settings.messageNotifications);
        // Note: isSellerMode is already managed by UserContext
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadUserSettings();
  }, []);

  // Save settings when they change
  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSetting('notificationsEnabled', value);
    // If disabling master, also disable sub-notifications
    if (!value) {
      setBidNotifications(false);
      setMessageNotifications(false);
      await saveSettings({
        bidNotifications: false,
        messageNotifications: false,
      });
    }
  };

  const handleBidNotificationToggle = async (value: boolean) => {
    setBidNotifications(value);
    await updateSetting('bidNotifications', value);
  };

  const handleMessageNotificationToggle = async (value: boolean) => {
    setMessageNotifications(value);
    await updateSetting('messageNotifications', value);
  };

  const handleSellerModeToggle = async (value: boolean) => {
    setIsSellerMode(value);
    await updateSetting('isSellerMode', value);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'To change your password, we will send a reset code to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            if (user?.email) {
              router.push({
                pathname: '/forgot-password' as any,
                params: { email: user.email },
              });
            } else {
              router.push('/forgot-password');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your listings, bids, and messages will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setShowDeleteModal(true);
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation.toUpperCase() !== 'DELETE') {
      Alert.alert('Invalid Confirmation', 'You must type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await api.delete('/api/auth/account');

      if (response.data.success) {
        // Logout user after successful deletion
        await logout();
        
        setShowDeleteModal(false);
        setDeleteConfirmation('');
        
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted. You will be logged out.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          response.data.message || 'Failed to delete account. Please try again later.'
        );
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleContactSupport = () => {
    const email = 'support@onlyswap.com';
    const subject = encodeURIComponent('OnlySwap Support Request');
    const body = encodeURIComponent(`Hello,\n\nI need help with:\n\n`);
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email client. Please contact support@onlyswap.com');
      }
    });
  };

  const handleOpenTerms = () => {
    router.push('/terms-of-service');
  };

  const handleOpenPrivacy = () => {
    router.push('/privacy-policy');
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const renderContent = () => {
    if (isLoadingSettings) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Loading your preferences...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Account Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Account</Text>

          <Pressable style={styles.row} onPress={() => router.push('/edit-profile')}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#86efac', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="person-outline" size={18} color="#0F172A" />
              </LinearGradient>
              <Text style={styles.rowTitle}>Edit Profile</Text>
            </View>
            <View style={styles.rowPill}>
              <Ionicons name="chevron-forward" size={16} color="#0F172A" />
            </View>
          </Pressable>

          <Pressable style={styles.row} onPress={handleChangePassword}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#fecaca', '#f87171']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="lock-closed-outline" size={18} color="#7F1D1D" />
              </LinearGradient>
              <Text style={styles.rowTitle}>Change Password</Text>
            </View>
            <View style={styles.rowPill}>
              <Ionicons name="chevron-forward" size={16} color="#0F172A" />
            </View>
          </Pressable>

          <View style={[styles.row, styles.rowStatic]}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#bae6fd', '#38bdf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="school-outline" size={18} color="#0C4A6E" />
              </LinearGradient>
              <View>
                <Text style={styles.rowTitle}>University</Text>
                <Text style={styles.rowSubtitle}>{user?.university || 'Not set'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#bbf7d0', '#4ade80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="storefront-outline" size={18} color="#14532d" />
              </LinearGradient>
              <View>
                <Text style={styles.rowTitle}>Default View</Text>
                <Text style={styles.rowSubtitle}>
                  {isSellerMode ? 'Seller Mode' : 'Buyer Mode'}
                </Text>
              </View>
            </View>
            <Switch
              value={isSellerMode}
              onValueChange={handleSellerModeToggle}
              trackColor={{ false: '#CBD5F5', true: '#86EFAC' }}
              thumbColor={isSellerMode ? '#22C55E' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Notifications</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#fee2e2', '#fca5a5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="notifications-outline" size={18} color="#7F1D1D" />
              </LinearGradient>
              <View>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSubtitle}>Enable notifications</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#CBD5F5', true: '#86EFAC' }}
              thumbColor={notificationsEnabled ? '#22C55E' : '#FFFFFF'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#fef3c7', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="heart-outline" size={18} color="#92400E" />
              </LinearGradient>
              <View>
                <Text style={styles.rowTitle}>Bid Notifications</Text>
                <Text style={styles.rowSubtitle}>New bids on your products</Text>
              </View>
            </View>
            <Switch
              value={bidNotifications && notificationsEnabled}
              onValueChange={handleBidNotificationToggle}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#CBD5F5', true: '#86EFAC' }}
              thumbColor={bidNotifications && notificationsEnabled ? '#22C55E' : '#FFFFFF'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#bae6fd', '#38bdf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#0C4A6E" />
              </LinearGradient>
              <View>
                <Text style={styles.rowTitle}>Message Notifications</Text>
                <Text style={styles.rowSubtitle}>New messages in chats</Text>
              </View>
            </View>
            <Switch
              value={messageNotifications && notificationsEnabled}
              onValueChange={handleMessageNotificationToggle}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#CBD5F5', true: '#86EFAC' }}
              thumbColor={messageNotifications && notificationsEnabled ? '#22C55E' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Support</Text>

          <Pressable style={styles.row} onPress={() => router.push('/help-support')}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#bae6fd', '#38bdf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="help-circle-outline" size={18} color="#0C4A6E" />
              </LinearGradient>
              <Text style={styles.rowTitle}>Help & Support</Text>
            </View>
            <View style={styles.rowPill}>
              <Ionicons name="chevron-forward" size={16} color="#0F172A" />
            </View>
          </Pressable>

          <Pressable style={styles.row} onPress={handleOpenTerms}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#e2e8f0', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="document-text-outline" size={18} color="#111827" />
              </LinearGradient>
              <Text style={styles.rowTitle}>Terms of Service</Text>
            </View>
            <View style={styles.rowPill}>
              <Ionicons name="chevron-forward" size={16} color="#0F172A" />
            </View>
          </Pressable>

          <Pressable style={styles.row} onPress={handleOpenPrivacy}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#e2e8f0', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#111827" />
              </LinearGradient>
              <Text style={styles.rowTitle}>Privacy Policy</Text>
            </View>
            <View style={styles.rowPill}>
              <Ionicons name="chevron-forward" size={16} color="#0F172A" />
            </View>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionCardDanger}>
          <Text style={styles.sectionLabelDanger}>Danger Zone</Text>

          <Pressable style={styles.row} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <LinearGradient
                colors={['#fecaca', '#f87171']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowIcon}
              >
                <Ionicons name="trash-outline" size={18} color="#7F1D1D" />
              </LinearGradient>
              <Text style={[styles.rowTitle, styles.rowTitleDanger]}>Delete Account</Text>
            </View>
            <View style={[styles.rowPill, styles.rowPillDanger]}>
              <Ionicons name="chevron-forward" size={16} color="#B91C1C" />
            </View>
          </Pressable>
        </View>
      </>
    );
  };

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
          <Text style={styles.heroTitle}>Settings</Text>
          <View style={styles.heroSpacer} />
        </View>

        <Text style={styles.heroDescription}>
          Personalize your experience, manage notifications, and keep your account secure.
        </Text>

        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={16} color="#065F46" />
            <Text style={styles.heroBadgeText}>Every change saves instantly</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>OnlySwap</Text>
          <Text style={styles.footerVersion}>Version {appVersion}</Text>
          <Text style={styles.footerLegal}>© 2024 OnlySwap. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete your account. This action cannot be undone.
            </Text>
            <Text style={styles.modalInstruction}>
              Type "DELETE" to confirm:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="Type DELETE"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeletingAccount}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeletingAccount}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  (deleteConfirmation.toUpperCase() !== 'DELETE' || isDeletingAccount) && styles.modalButtonDisabled,
                ]}
                onPress={confirmDeleteAccount}
                disabled={deleteConfirmation.toUpperCase() !== 'DELETE' || isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Delete Account</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
  heroDescription: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    color: '#065F46',
  },
  heroBadges: {
    marginTop: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 8,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 24,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  loadingText: {
    marginTop: 18,
    fontSize: 16,
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  sectionCardDanger: {
    backgroundColor: '#FFF1F2',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  sectionLabelDanger: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  rowStatic: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowTitleDanger: {
    color: '#B91C1C',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  rowPill: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowPillDanger: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerVersion: {
    fontSize: 14,
    color: '#475569',
  },
  footerLegal: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonDelete: {
    backgroundColor: '#DC2626',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

