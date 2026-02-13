import { useUser } from '@/context/UserContext';
import { getApiBaseUrl } from '@/services/apiConfig';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, loadUser } = useUser();

  // Refresh user data when screen comes into focus (e.g., returning from edit profile)
  // Use a ref to prevent multiple simultaneous loads and debounce the reload
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  
  useFocusEffect(
    useCallback(() => {
      // Only reload if:
      // 1. Not currently loading
      // 2. User exists (authenticated)
      // 3. At least 1 second has passed since last load (debounce)
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTimeRef.current;
      
      if (!isLoadingRef.current && user && timeSinceLastLoad > 1000) {
        isLoadingRef.current = true;
        lastLoadTimeRef.current = now;
        // Use silent=true to prevent loading state from causing tab layout to flash
        loadUser(true).finally(() => {
          isLoadingRef.current = false;
        });
      }
    }, [loadUser, user])
  );

  const handleLogout = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting logout process...');
              
              // Clear auth data first
              await logout();
              
              // Navigate to login page after logout
              router.replace('/login');
              
              console.log('✅ User logged out successfully');
              
            } catch (error) {
              console.error('❌ Error during logout:', error);
              // Still navigate to login even if there's an error
              router.replace('/login');
            }
          },
        },
      ],
      'warning'
    );
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const quickActions = [
    {
      key: 'listings',
      label: 'My Listings',
      caption: 'Manage your products',
      icon: 'albums-outline' as const,
      gradient: ['#86efac', '#22c55e'],
      onPress: () => router.push('/my-listings'),
    },
    {
      key: 'bids',
      label: 'My Bids',
      caption: 'Review your offers',
      icon: 'cash-outline' as const,
      gradient: ['#a5f3fc', '#38bdf8'],
      onPress: () => router.push('/my-bids'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* Hero */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#bbf7d0', '#34d399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroGreeting}>
                Hey {user?.firstName || 'there'} 👋
              </Text>
              <Text style={styles.heroSubtitle}>
                Keep track of your marketplace activity and profile details.
              </Text>
            </View>
            <Pressable
              style={styles.heroSettingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={22} color="#14532D" />
            </Pressable>
          </View>
          {memberSince && (
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaBadge}>
                <Ionicons name="time-outline" size={16} color="#14532D" />
                <Text style={styles.heroMetaText}>Member since {memberSince}</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.profilePicture ? (
              <Image
                source={{
                  uri: user.profilePicture.startsWith('http')
                    ? user.profilePicture
                    : `${getApiBaseUrl()}${user.profilePicture}`,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <LinearGradient
                colors={['#9be7ae', '#4caf50']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color="#4caf50" />
              <Text style={styles.universityText}>{user?.university}</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.editProfileButton}
          onPress={() => router.push('/edit-profile')}
        >
          <LinearGradient
            colors={['#6cc27a', '#4caf50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editProfileGradient}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <LinearGradient
                colors={action.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionIcon}
              >
                <Ionicons name={action.icon} size={20} color="#0F172A" />
              </LinearGradient>
              <Text style={styles.quickActionTitle}>{action.label}</Text>
              <Text style={styles.quickActionCaption}>{action.caption}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Pressable style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
          <View style={styles.menuItemLeft}>
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              style={styles.menuIconGradient}
            >
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/my-listings')}>
          <View style={styles.menuItemLeft}>
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              style={styles.menuIconGradient}
            >
              <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.menuItemText}>My Listings</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/my-bids')}>
          <View style={styles.menuItemLeft}>
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              style={styles.menuIconGradient}
            >
              <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.menuItemText}>My Bids</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/settings')}>
          <View style={styles.menuItemLeft}>
            <LinearGradient
              colors={['#6cc27a', '#4caf50']}
              style={styles.menuIconGradient}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.menuIconGradient}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.menuItemText, styles.logoutText]}>Sign Out</Text>
          </View>
          <View style={[styles.menuItemRight, styles.menuItemRightDanger]}>
            <Ionicons name="arrow-forward" size={18} color="#dc2626" />
          </View>
        </Pressable>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>OnlySwap -test version</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 48,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  heroGradient: {
    borderRadius: 28,
    padding: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroHeaderText: {
    flex: 1,
    paddingRight: 16,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#14532D',
    opacity: 0.85,
  },
  heroSettingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  heroMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroMetaText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -60,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 18,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b6b6b',
    marginLeft: 8,
  },
  universityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  editProfileButton: {
    marginTop: 20,
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 6,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickActionCaption: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 26,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemRight: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemRightDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  logoutText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

