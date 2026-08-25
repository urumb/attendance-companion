import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarButton: HapticTab, tabBarActiveTintColor: colors.primary, tabBarStyle: { height: 56 + bottom, paddingBottom: bottom, paddingTop: 8, backgroundColor: colors.background, borderTopColor: colors.border } }}>
    <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: ({ color }) => <IconSymbol name="calendar" size={24} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" size={24} color={color} /> }} />
  </Tabs>;
}
