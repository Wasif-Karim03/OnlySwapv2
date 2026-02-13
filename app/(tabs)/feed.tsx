import { useUser } from "@/context/UserContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface FeedPost {
  _id: string;
  content: string;
  likeCount: number;
  commentCount: number;
  isAnonymous: boolean;
  university: string;
  createdAt: string;
  userLiked?: boolean;
  userId?: {
    _id?: string;
    firstName: string;
    lastName: string;
    university: string;
  };
}

export default function FeedScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const fabScale = useSharedValue(1);
  const fabOpacity = useSharedValue(0);

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

    // FAB animation
    fabOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const fabStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ scale: fabScale.value }],
  }));

  const AnimatedView = Animated.View;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const fetchFeed = useCallback(async (showRefreshIndicator = false) => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      setPosts([]);
      return;
    }

    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await api.get<{ success: boolean; count: number; data: FeedPost[] }>(
        "/api/feed"
      );

      if (response.data.success) {
        const postsData = response.data.data || [];
        setPosts(postsData);
        
        // Update liked posts state from API response
        const likedSet = new Set<string>();
        postsData.forEach((post: FeedPost) => {
          if (post.userLiked) {
            likedSet.add(post._id);
          }
        });
        setLikedPosts(likedSet);
      }
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      Alert.alert("Error", "Failed to load feed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleLike = async (postId: string) => {
    // Prevent double-clicking
    if (likingPostId === postId) return;
    
    // Find the post to get current like state from server
    const post = posts.find((p) => p._id === postId);
    const isLiked = post?.userLiked !== undefined ? post.userLiked : likedPosts.has(postId);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikingPostId(postId);
    
    try {
      if (isLiked) {
        await api.put(`/api/feed/${postId}/unlike`);
      } else {
        await api.put(`/api/feed/${postId}/like`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Always refresh feed to sync with server state (this will update userLiked from server)
      await fetchFeed();
    } catch (error: any) {
      // If error is "already liked" or "not liked" (400 status), this is expected
      // when local state is out of sync - just sync with server silently
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.message || '';
        if (errorMessage.includes('already liked') || errorMessage.includes('not liked')) {
          // Expected state mismatch - just refresh to sync, no need to log
          await fetchFeed();
        } else {
          // Other 400 errors - still sync but log for debugging
          console.warn("Like action returned 400:", errorMessage);
          await fetchFeed();
        }
      } else {
        // Actual errors (network, server errors, etc.) - log and sync
        console.error("Error liking post:", error);
        await fetchFeed();
      }
    } finally {
      setLikingPostId(null);
    }
  };


  const formatTimeAgo = (dateString: string) => {
    return moment(dateString).fromNow();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#22C55E" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#ECFDF5", "#FFFFFF"]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView style={[styles.heroContent, headerStyle]}>
          <View style={styles.heroRow}>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>Campus Feed</Text>
              <Text style={styles.heroSubtitle}>
                {user?.university || "OnlySwap"}
              </Text>
            </View>
            <View style={styles.heroButtons}>
              <Pressable
                style={styles.heroButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  fetchFeed(true);
                }}
              >
                <LinearGradient
                  colors={["#34d399", "#22c55e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroButtonGradient}
                >
                  <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
              <Pressable
                style={styles.heroPostButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/feed/create-post");
                }}
              >
                <LinearGradient
                  colors={["#34d399", "#10b981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPostButtonGradient}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </AnimatedView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchFeed(true)}
            tintColor="#22C55E"
            colors={["#22C55E"]}
          />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <LinearGradient
              colors={["#bbf7d0", "#4ade80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <Ionicons name="megaphone-outline" size={32} color="#064E3B" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Nothing yet</Text>
            <Text style={styles.emptySubtitle}>
              Start the conversation by sharing something with your campus.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/feed/create-post")}
            >
              <LinearGradient
                colors={["#34d399", "#10b981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create a post</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          posts.map((post) => {
            const isLiked =
              post.userLiked !== undefined
                ? post.userLiked
                : likedPosts.has(post._id);

            return (
              <View key={post._id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <LinearGradient
                    colors={["#bbf7d0", "#34d399"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarBadge}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#14532d"
                    />
                  </LinearGradient>
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>Anonymous</Text>
                    <Text style={styles.postTime}>
                      {formatTimeAgo(post.createdAt)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                <View style={styles.postActions}>
                  <Pressable
                    style={[
                      styles.actionChip,
                      isLiked && styles.actionChipLiked,
                    ]}
                    onPress={() => handleLike(post._id)}
                    disabled={likingPostId === post._id}
                  >
                    <Ionicons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={18}
                      color={isLiked ? "#FFFFFF" : "#475569"}
                    />
                    <Text
                      style={[
                        styles.actionChipText,
                        isLiked && styles.actionChipTextLiked,
                      ]}
                    >
                      {post.likeCount || 0}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionChip}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/feed/comments/${post._id}`);
                    }}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color="#475569"
                    />
                    <Text style={styles.actionChipText}>
                      {post.commentCount || 0}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AnimatedPressable
        style={[styles.fab, fabStyle]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          fabScale.value = withSpring(
            0.9,
            {
              damping: 10,
              stiffness: 300,
            },
            () => {
              fabScale.value = withSpring(1, {
                damping: 10,
                stiffness: 300,
              });
            }
          );
          router.push("/feed/create-post");
        }}
      >
        <LinearGradient
          colors={["#34d399", "#10b981"]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  hero: {
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    gap: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#064E3B",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#047857",
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 20,
  },
  heroButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  heroButtonGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPostButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  heroPostButtonGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
    gap: 16,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    gap: 16,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    width: "100%",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 6,
    gap: 18,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  postTime: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    color: "#0F172A",
    lineHeight: 24,
  },
  postActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
  },
  actionChipLiked: {
    backgroundColor: "#ef4444",
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  actionChipTextLiked: {
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
});

