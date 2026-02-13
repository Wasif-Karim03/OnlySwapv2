import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { protectAdminRoute } from "@/utils/protectAdminRoute";

const ADMIN_TOKEN_KEY = "@onlyswap_admin_token";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    protectAdminRoute();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    router.replace("/admin/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to the Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your OnlySwap platform</Text>

        <Pressable
          style={styles.menuButton}
          onPress={() => router.push("/admin/users")}
        >
          <Text style={styles.menuButtonText}>User Management</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
  },
  menuButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    minWidth: 200,
    alignItems: "center",
  },
  menuButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

