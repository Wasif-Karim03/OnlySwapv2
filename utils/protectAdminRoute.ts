import AsyncStorage from "@react-native-async-storage/async-storage";
import { redirect } from "expo-router";

const ADMIN_TOKEN_KEY = "@onlyswap_admin_token";

export const protectAdminRoute = async () => {
  try {
    const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      redirect("/admin/login");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking admin token:", error);
    redirect("/admin/login");
    return false;
  }
};


