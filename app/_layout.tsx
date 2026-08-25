import "../global.css";
import { useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppStoreProvider } from "@/lib/app-store";
import { createTRPCClient, trpc } from "@/lib/trpc";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());
  return <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><ThemeProvider><AppStoreProvider><Stack screenOptions={{ headerShown: false }} /></AppStoreProvider></ThemeProvider></QueryClientProvider></trpc.Provider>;
}
