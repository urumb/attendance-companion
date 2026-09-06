import { Alert, Platform } from "react-native";

export type DialogButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export function showAlert(title: string, message?: string, buttons?: DialogButton[]): void {
  if (Platform.OS === "web") {
    const text = [title, message].filter(Boolean).join("\n\n");
    if (!buttons || buttons.length <= 1) {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(text);
      }
      buttons?.[0]?.onPress?.();
      return;
    }

    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const confirmed = window.confirm(text);
      if (confirmed) {
        const confirmBtn = buttons.find((btn) => btn.style !== "cancel") ?? buttons[buttons.length - 1];
        confirmBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((btn) => btn.style === "cancel") ?? buttons[0];
        cancelBtn?.onPress?.();
      }
    }
    return;
  }

  Alert.alert(title, message, buttons);
}
