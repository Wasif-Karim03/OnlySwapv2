import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Image,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getApiBaseUrl } from "@/services/apiConfig";
import { protectAdminRoute } from "@/utils/protectAdminRoute";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ADMIN_TOKEN_KEY = "@onlyswap_admin_token";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  images: string[];
  createdAt: string;
  leftSwipeCount: number;
  rightSwipeCount: number;
}

interface Bid {
  _id: string;
  amount: number;
  createdAt: string;
  productId: {
    _id: string;
    title: string;
    price: number;
    status: string;
    category: string;
  };
  sellerId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  buyerId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ChatThread {
  _id: string;
  productId: {
    _id: string;
    title: string;
    price: number;
  };
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  sellerId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  buyerId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SupportTicket {
  _id: string;
  type: string;
  subject: string;
  description: string;
  createdAt: string;
  userId?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface FeedPost {
  _id: string;
  content: string;
  university: string;
  likeCount?: number;
  commentCount: number;
  isAnonymous: boolean;
  createdAt: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    university: string;
  };
  likes?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

interface FeedComment {
  _id: string;
  content: string;
  university: string;
  isAnonymous: boolean;
  createdAt: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    university: string;
  };
  postId: {
    _id: string;
    content: string;
  };
  parentCommentId?: string;
}

interface UserDetails {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    university: string;
    isSuspended: boolean;
    role: string;
    profilePicture: string | null;
    createdAt: string;
  };
  stats: {
    products: {
      total: number;
      available: number;
      sold: number;
      pending: number;
    };
    bids: {
      made: number;
      received: number;
      total: number;
    };
    chats: {
      asBuyer: number;
      asSeller: number;
      total: number;
    };
    supportTickets: number;
    reports: number;
    feedPosts: number;
    feedComments: number;
  };
  products: Product[];
  bids: Bid[];
  bidsReceived: Bid[];
  chatThreads: {
    asBuyer: ChatThread[];
    asSeller: ChatThread[];
  };
  supportTickets: SupportTicket[];
  reports: SupportTicket[];
  feedPosts: FeedPost[];
  feedComments: FeedComment[];
}

export default function UserDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "bids" | "chats" | "tickets" | "feed">("products");
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspendingProduct, setSuspendingProduct] = useState(false);

  useEffect(() => {
    protectAdminRoute();
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const apiUrl = getApiBaseUrl();
      const res = await axios.get(`${apiUrl}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setUserDetails(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      if (err.response?.status === 401) {
        router.replace("/admin/login");
      } else if (err.response?.status === 404) {
        Alert.alert("Error", "User not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Failed to fetch user details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!userDetails) return;

    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${userDetails.user.isSuspended ? "unsuspend" : "suspend"} this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
              if (!token) return;

              const apiUrl = getApiBaseUrl();
              await axios.put(
                `${apiUrl}/api/admin/users/${id}/suspend`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              Alert.alert("Success", `User ${userDetails.user.isSuspended ? "unsuspended" : "suspended"}`);
              fetchUserDetails();
            } catch (err: any) {
              console.error("Error suspending user:", err);
              Alert.alert("Error", "Failed to update user status");
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!userDetails) return;

    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userDetails.user.firstName} ${userDetails.user.lastName}? This action cannot be undone and will delete all related data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
              if (!token) return;

              const apiUrl = getApiBaseUrl();
              await axios.delete(`${apiUrl}/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert("Success", "User deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              console.error("Error deleting user:", err);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      Alert.alert("Error", "Please fill in both subject and message");
      return;
    }

    setSendingEmail(true);
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) return;

      const apiUrl = getApiBaseUrl();
      await axios.post(
        `${apiUrl}/api/admin/users/${id}/send-email`,
        {
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", "Email sent successfully to user", [
        {
          text: "OK",
          onPress: () => {
            setEmailModalVisible(false);
            setEmailSubject("");
            setEmailMessage("");
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error sending email:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to send email. Please try again."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSuspendProduct = (product: Product) => {
    setSelectedProduct(product);
    setSuspensionReason("");
    setSuspendModalVisible(true);
  };

  const confirmSuspendProduct = async () => {
    if (!selectedProduct || !suspensionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for suspending this product");
      return;
    }

    setSuspendingProduct(true);
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) return;

      const apiUrl = getApiBaseUrl();
      await axios.post(
        `${apiUrl}/api/admin/products/${selectedProduct._id}/suspend`,
        {
          reason: suspensionReason.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", "Product suspended successfully. The seller will be notified via email and notification.", [
        {
          text: "OK",
          onPress: () => {
            setSuspendModalVisible(false);
            setSelectedProduct(null);
            setSuspensionReason("");
            // Refresh user details to show updated product status
            fetchUserDetails();
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error suspending product:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to suspend product. Please try again."
      );
    } finally {
      setSuspendingProduct(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    const apiUrl = getApiBaseUrl();
    return `${apiUrl}${path}`;
  };

  // Get all image URLs for a product
  const getProductImages = (product: Product): string[] => {
    const images: string[] = [];
    
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        const url = getImageUrl(img);
        if (url) images.push(url);
      });
    }
    
    return images;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

      const { user, stats, products, bids, bidsReceived, chatThreads, supportTickets, reports, feedPosts, feedComments } =
        userDetails;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </Pressable>
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          {user.isSuspended && (
            <View style={styles.suspendedBadge}>
              <Text style={styles.suspendedText}>SUSPENDED</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>University:</Text>
          <Text style={styles.value}>{user.university}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{user.role}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since:</Text>
          <Text style={styles.value}>{formatDate(user.createdAt)}</Text>
        </View>
      </View>

      {/* Quick Actions - Send Email */}
      <View style={styles.card}>
        <Pressable
          style={[styles.quickActionButton, styles.emailButton]}
          onPress={() => setEmailModalVisible(true)}
        >
          <Ionicons name="mail-outline" size={24} color="#ffffff" />
          <Text style={styles.quickActionText}>Send Email to User</Text>
        </Pressable>
      </View>

      {/* Statistics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Statistics Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.products.total}</Text>
            <Text style={styles.statLabel}>Products</Text>
            <Text style={styles.statSubtext}>
              {stats.products.available} available, {stats.products.sold} sold
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.bids.total}</Text>
            <Text style={styles.statLabel}>Bids</Text>
            <Text style={styles.statSubtext}>
              {stats.bids.made} made, {stats.bids.received} received
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.chats.total}</Text>
            <Text style={styles.statLabel}>Chats</Text>
            <Text style={styles.statSubtext}>
              {stats.chats.asBuyer} as buyer, {stats.chats.asSeller} as seller
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.reports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
            <Text style={styles.statSubtext}>Against this user</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.feedPosts}</Text>
            <Text style={styles.statLabel}>Feed Posts</Text>
            <Text style={styles.statSubtext}>Anonymous posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.feedComments}</Text>
            <Text style={styles.statLabel}>Feed Comments</Text>
            <Text style={styles.statSubtext}>Comments & replies</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === "products" && styles.tabActive]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Products ({products.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "bids" && styles.tabActive]}
          onPress={() => setActiveTab("bids")}
        >
          <Text style={[styles.tabText, activeTab === "bids" && styles.tabTextActive]}>
            Bids ({bids.length + bidsReceived.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "chats" && styles.tabActive]}
          onPress={() => setActiveTab("chats")}
        >
          <Text style={[styles.tabText, activeTab === "chats" && styles.tabTextActive]}>
            Chats ({chatThreads.asBuyer.length + chatThreads.asSeller.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "tickets" && styles.tabActive]}
          onPress={() => setActiveTab("tickets")}
        >
          <Text style={[styles.tabText, activeTab === "tickets" && styles.tabTextActive]}>
            Tickets ({supportTickets.length + reports.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "feed" && styles.tabActive]}
          onPress={() => setActiveTab("feed")}
        >
          <Text style={[styles.tabText, activeTab === "feed" && styles.tabTextActive]}>
            Feed ({feedPosts?.length || 0})
          </Text>
        </Pressable>
      </View>

      {/* Products Tab */}
      {activeTab === "products" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Products Posted ({products.length})</Text>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>No products posted</Text>
          ) : (
            products.map((product) => {
              const productImages = getProductImages(product);
              return (
                <View key={product._id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{product.title}</Text>
                    <View style={styles.statusBadgeContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          product.status === "available" && styles.statusAvailable,
                          product.status === "sold" && styles.statusSold,
                          product.status === "pending" && styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>{product.status.toUpperCase()}</Text>
                      </View>
                      {(product as any).isSuspended && (
                        <View style={[styles.statusBadge, styles.statusSuspended]}>
                          <Text style={styles.statusText}>SUSPENDED</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Product Images */}
                  {productImages.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.imagesContainer}
                      contentContainerStyle={styles.imagesContent}
                    >
                      {productImages.map((imageUrl, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={40} color="#9ca3af" />
                      <Text style={styles.noImageText}>No images</Text>
                    </View>
                  )}

                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Price: </Text>${product.price}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Category: </Text>
                      {product.category}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Posted: </Text>
                      {formatDate(product.createdAt)}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Views: </Text>
                      {product.leftSwipeCount + product.rightSwipeCount} (
                      {product.rightSwipeCount} interested)
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Images: </Text>
                      {productImages.length}
                    </Text>
                  </View>
                  
                  {/* Suspend Product Button */}
                  {!(product as any).isSuspended && (
                    <Pressable
                      style={styles.suspendButton}
                      onPress={() => handleSuspendProduct(product)}
                    >
                      <Ionicons name="ban-outline" size={18} color="#ffffff" />
                      <Text style={styles.suspendButtonText}>Suspend Product</Text>
                    </Pressable>
                  )}
                  
                  {(product as any).isSuspended && (
                    <View style={styles.suspendedInfo}>
                      <Text style={styles.suspendedInfoText}>
                        Suspended on: {formatDate((product as any).suspendedAt || product.createdAt)}
                      </Text>
                      {(product as any).suspensionReason && (
                        <Text style={styles.suspendedReasonText}>
                          Reason: {(product as any).suspensionReason}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Bids Tab */}
      {activeTab === "bids" && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bids Made ({bids.length})</Text>
            {bids.length === 0 ? (
              <Text style={styles.emptyText}>No bids made</Text>
            ) : (
              bids.map((bid) => (
                <View key={bid._id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    ${bid.amount} on {bid.productId?.title || "Unknown Product"}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Product Price: </Text>$
                      {bid.productId?.price}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Status: </Text>
                      {bid.productId?.status}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Category: </Text>
                      {bid.productId?.category}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Seller: </Text>
                      {bid.sellerId
                        ? `${bid.sellerId.firstName} ${bid.sellerId.lastName}`
                        : "Unknown"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Bid Date: </Text>
                      {formatDate(bid.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bids Received ({bidsReceived.length})</Text>
            {bidsReceived.length === 0 ? (
              <Text style={styles.emptyText}>No bids received</Text>
            ) : (
              bidsReceived.map((bid) => (
                <View key={bid._id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    ${bid.amount} on {bid.productId?.title || "Unknown Product"}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Product Price: </Text>$
                      {bid.productId?.price}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Status: </Text>
                      {bid.productId?.status}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Bidder: </Text>
                      {bid.buyerId
                        ? `${bid.buyerId.firstName} ${bid.buyerId.lastName} (${bid.buyerId.email})`
                        : "Unknown"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Bid Date: </Text>
                      {formatDate(bid.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Chats Tab */}
      {activeTab === "chats" && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chats as Buyer ({chatThreads.asBuyer.length})</Text>
            {chatThreads.asBuyer.length === 0 ? (
              <Text style={styles.emptyText}>No chats as buyer</Text>
            ) : (
              chatThreads.asBuyer.map((thread) => (
                <View key={thread._id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    {thread.productId?.title || "Unknown Product"}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Seller: </Text>
                      {thread.sellerId
                        ? `${thread.sellerId.firstName} ${thread.sellerId.lastName} (${thread.sellerId.email})`
                        : "Unknown"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Product Price: </Text>$
                      {thread.productId?.price}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Last Message: </Text>
                      {thread.lastMessage || "No messages"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Last Activity: </Text>
                      {formatDate(thread.lastMessageAt)}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Started: </Text>
                      {formatDate(thread.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Chats as Seller ({chatThreads.asSeller.length})</Text>
            {chatThreads.asSeller.length === 0 ? (
              <Text style={styles.emptyText}>No chats as seller</Text>
            ) : (
              chatThreads.asSeller.map((thread) => (
                <View key={thread._id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>
                    {thread.productId?.title || "Unknown Product"}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Buyer: </Text>
                      {thread.buyerId
                        ? `${thread.buyerId.firstName} ${thread.buyerId.lastName} (${thread.buyerId.email})`
                        : "Unknown"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Product Price: </Text>$
                      {thread.productId?.price}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Last Message: </Text>
                      {thread.lastMessage || "No messages"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Last Activity: </Text>
                      {formatDate(thread.lastMessageAt)}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Started: </Text>
                      {formatDate(thread.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Support Tickets ({supportTickets.length})
            </Text>
            {supportTickets.length === 0 ? (
              <Text style={styles.emptyText}>No support tickets</Text>
            ) : (
              supportTickets.map((ticket) => (
                <View key={ticket._id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{ticket.subject}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{ticket.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={3}>
                    {ticket.description}
                  </Text>
                  <Text style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Created: </Text>
                    {formatDate(ticket.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reports Against User ({reports.length})</Text>
            {reports.length === 0 ? (
              <Text style={styles.emptyText}>No reports against this user</Text>
            ) : (
              reports.map((report) => (
                <View key={report._id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{report.subject}</Text>
                    <View style={styles.reportBadge}>
                      <Text style={styles.typeText}>REPORT</Text>
                    </View>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={3}>
                    {report.description}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Reported by: </Text>
                      {report.userId
                        ? `${report.userId.firstName} ${report.userId.lastName} (${report.userId.email})`
                        : "Unknown"}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Type: </Text>
                      {report.type}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Date: </Text>
                      {formatDate(report.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Feed Tab */}
      {activeTab === "feed" && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Feed Posts ({feedPosts?.length || 0})
            </Text>
            {!feedPosts || feedPosts.length === 0 ? (
              <Text style={styles.emptyText}>No feed posts</Text>
            ) : (
              feedPosts.map((post) => (
                <View key={post._id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.feedPostHeader}>
                      <View>
                        <Text style={styles.itemTitle}>Post by: {post.userId?.firstName} {post.userId?.lastName}</Text>
                        <Text style={styles.feedPostEmail}>{post.userId?.email}</Text>
                      </View>
                      {post.isAnonymous && (
                        <View style={styles.anonymousBadge}>
                          <Text style={styles.anonymousText}>ANONYMOUS</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemDescription}>{post.content}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>University: </Text>
                      {post.university}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Likes: </Text>
                      {post.likes?.length || post.likeCount || 0}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Comments: </Text>
                      {post.commentCount || 0}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Posted: </Text>
                      {formatDate(post.createdAt)}
                    </Text>
                  </View>
                  {post.likes && post.likes.length > 0 && (
                    <View style={styles.likesSection}>
                      <Text style={styles.likesLabel}>Liked by:</Text>
                      {post.likes.slice(0, 5).map((like, index) => (
                        <Text key={like._id} style={styles.likeUser}>
                          • {like.firstName} {like.lastName} ({like.email})
                        </Text>
                      ))}
                      {post.likes.length > 5 && (
                        <Text style={styles.likeUser}>... and {post.likes.length - 5} more</Text>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Feed Comments ({feedComments?.length || 0})
            </Text>
            {!feedComments || feedComments.length === 0 ? (
              <Text style={styles.emptyText}>No feed comments</Text>
            ) : (
              feedComments.map((comment) => (
                <View key={comment._id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>
                      Comment by: {comment.userId?.firstName} {comment.userId?.lastName}
                    </Text>
                  </View>
                  <Text style={styles.feedPostEmail}>{comment.userId?.email}</Text>
                  <Text style={styles.itemDescription}>{comment.content}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Post: </Text>
                      {comment.postId?.content?.substring(0, 50)}
                      {comment.postId?.content && comment.postId.content.length > 50 ? "..." : ""}
                    </Text>
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>University: </Text>
                      {comment.university}
                    </Text>
                    {comment.parentCommentId && (
                      <Text style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Type: </Text>
                        <Text style={styles.replyLabel}>Reply to comment</Text>
                      </Text>
                    )}
                    <Text style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Posted: </Text>
                      {formatDate(comment.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => setEmailModalVisible(true)}
        >
          <Ionicons name="mail-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Send Email</Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            user.isSuspended ? styles.unsuspendButton : styles.suspendButton,
          ]}
          onPress={handleSuspend}
        >
          <Text style={styles.actionButtonText}>
            {user.isSuspended ? "Unsuspend User" : "Suspend User"}
          </Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.actionButtonText}>Delete User</Text>
        </Pressable>
      </View>

      {/* Email Modal */}
      <Modal
        visible={emailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Email to User</Text>
              <Pressable
                onPress={() => {
                  setEmailModalVisible(false);
                  setEmailSubject("");
                  setEmailMessage("");
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>To:</Text>
              <Text style={styles.modalValue}>
                {user.firstName} {user.lastName} ({user.email})
              </Text>

              <Text style={styles.modalLabel}>Subject:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter email subject"
                placeholderTextColor="#9ca3af"
                value={emailSubject}
                onChangeText={setEmailSubject}
                maxLength={200}
              />

              <Text style={styles.modalLabel}>Message:</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter your message to the user..."
                placeholderTextColor="#9ca3af"
                value={emailMessage}
                onChangeText={setEmailMessage}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={2000}
              />

              <Text style={styles.modalCharCount}>
                {emailMessage.length}/2000 characters
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setEmailModalVisible(false);
                  setEmailSubject("");
                  setEmailMessage("");
                }}
                disabled={sendingEmail}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalSendButton]}
                onPress={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.modalSendText}>Send Email</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Suspend Product Modal */}
      <Modal
        visible={suspendModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSuspendModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suspend Product</Text>
              <Pressable
                onPress={() => {
                  setSuspendModalVisible(false);
                  setSelectedProduct(null);
                  setSuspensionReason("");
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Product:</Text>
              <Text style={styles.modalValue}>
                {selectedProduct?.title}
              </Text>

              <Text style={styles.modalLabel}>Reason for Suspension:</Text>
              <Text style={styles.modalSubtext}>
                Please provide a clear reason for suspending this product. The seller will be notified via email and in-app notification.
              </Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter reason for suspension (e.g., Violates community guidelines, Inappropriate content, etc.)"
                placeholderTextColor="#9ca3af"
                value={suspensionReason}
                onChangeText={setSuspensionReason}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />

              <Text style={styles.modalCharCount}>
                {suspensionReason.length}/500 characters
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setSuspendModalVisible(false);
                  setSelectedProduct(null);
                  setSuspensionReason("");
                }}
                disabled={suspendingProduct}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalSuspendButton]}
                onPress={confirmSuspendProduct}
                disabled={suspendingProduct || !suspensionReason.trim()}
              >
                {suspendingProduct ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="ban" size={18} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.modalSendText}>Suspend Product</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 60,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  suspendedBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  suspendedText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    width: 120,
  },
  value: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#2563eb",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  itemCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 8,
  },
  imagesContainer: {
    marginVertical: 12,
    marginHorizontal: -4,
  },
  imagesContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  noImageText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemDetailLabel: {
    fontWeight: "600",
    color: "#4b5563",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusAvailable: {
    backgroundColor: "#10b981",
  },
  statusSold: {
    backgroundColor: "#6b7280",
  },
  statusPending: {
    backgroundColor: "#f59e0b",
  },
  statusText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  typeBadge: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reportBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    padding: 20,
  },
  feedPostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  feedPostEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  anonymousBadge: {
    backgroundColor: "#9ca3af",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  anonymousText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  likesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  likesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 6,
  },
  likeUser: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },
  replyLabel: {
    color: "#2563eb",
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suspendButton: {
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  suspendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  suspendedInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  suspendedInfoText: {
    fontSize: 12,
    color: "#991b1b",
    marginBottom: 4,
  },
  suspendedReasonText: {
    fontSize: 12,
    color: "#7f1d1d",
    fontWeight: "600",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  statusSuspended: {
    backgroundColor: "#ef4444",
  },
  unsuspendButton: {
    backgroundColor: "#10b981",
  },
  modalSuspendButton: {
    backgroundColor: "#ef4444",
  },
  modalSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 16,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emailButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 12,
  },
  modalValue: {
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 44,
  },
  modalTextArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  modalCharCount: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  modalCancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  modalCancelText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSendButton: {
    backgroundColor: "#2563eb",
  },
  modalSendText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
