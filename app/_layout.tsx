import "../global.css";
import { Stack } from "expo-router";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppStoreProvider } from "@/lib/app-store";

export default function RootLayout() {
  return <ThemeProvider><AppStoreProvider><Stack screenOptions={{ headerShown: false }} /></AppStoreProvider></ThemeProvider>;
}
