import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { getApiBaseUrl } from "@/services/apiConfig";
import { protectAdminRoute } from "@/utils/protectAdminRoute";

const ADMIN_TOKEN_KEY = "@onlyswap_admin_token";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  isSuspended: boolean;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [suspended, setSuspended] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    protectAdminRoute();
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [search, university, suspended]);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const apiUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (university) params.append("university", university);
      if (suspended !== "") params.append("suspended", suspended);

      const res = await axios.get(`${apiUrl}/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 401) {
        router.replace("/admin/login");
      } else {
        Alert.alert("Error", "Failed to fetch users");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleSuspend = async (id: string, currentStatus: boolean) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${currentStatus ? "unsuspend" : "suspend"} this user?`,
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

              Alert.alert("Success", `User ${currentStatus ? "unsuspended" : "suspended"}`);
              fetchUsers();
            } catch (err: any) {
              console.error("Error suspending user:", err);
              Alert.alert("Error", "Failed to update user status");
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (id: string, userName: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userName}? This action cannot be undone and will delete all related data.`,
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

              Alert.alert("Success", "User deleted successfully");
              fetchUsers();
            } catch (err: any) {
              console.error("Error deleting user:", err);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = async (id: string) => {
    router.push(`/admin/users/${id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search by name or email"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />

          <TextInput
            style={styles.input}
            placeholder="Filter by university"
            placeholderTextColor="#999"
            value={university}
            onChangeText={setUniversity}
          />

          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterButton, suspended === "" && styles.filterButtonActive]}
              onPress={() => setSuspended("")}
            >
              <Text style={[styles.filterButtonText, suspended === "" && styles.filterButtonTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterButton, suspended === "false" && styles.filterButtonActive]}
              onPress={() => setSuspended("false")}
            >
              <Text
                style={[styles.filterButtonText, suspended === "false" && styles.filterButtonTextActive]}
              >
                Active
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterButton, suspended === "true" && styles.filterButtonActive]}
              onPress={() => setSuspended("true")}
            >
              <Text
                style={[styles.filterButtonText, suspended === "true" && styles.filterButtonTextActive]}
              >
                Suspended
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Users List */}
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user._id} style={styles.userCard}>
              <Pressable
                style={styles.userInfo}
                onPress={() => handleViewDetails(user._id)}
              >
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
                <Text style={styles.userUniversity}>{user.university}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>Role: {user.role}</Text>
              </Pressable>

              <View style={styles.actionsContainer}>
                <Pressable
                  style={[
                    styles.actionButton,
                    user.isSuspended ? styles.unsuspendButton : styles.suspendButton,
                  ]}
                  onPress={() => handleSuspend(user._id, user.isSuspended)}
                >
                  <Text style={styles.actionButtonText}>
                    {user.isSuspended ? "Unsuspend" : "Suspend"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(243, 244, 246, 0.9)",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  suspendedBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  suspendedText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  userUniversity: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suspendButton: {
    backgroundColor: "#f59e0b",
  },
  unsuspendButton: {
    backgroundColor: "#10b981",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
});

