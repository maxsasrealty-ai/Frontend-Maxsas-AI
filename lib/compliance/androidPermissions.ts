import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";

function confirmPermission(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Continue",
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      }
    );
  });
}

async function requestAndroidPermission(
  permission: string,
  title: string,
  message: string,
  deniedMessage: string
): Promise<boolean> {
  if (Platform.OS !== "android" || !PermissionsAndroid?.request) {
    return true;
  }

  const shouldContinue = await confirmPermission(title, message);
  if (!shouldContinue) {
    return false;
  }

  try {
    const result = await PermissionsAndroid.request(permission);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
  } catch {
    // Fall through to denial handling below.
  }

  Alert.alert("Permission denied", deniedMessage, [
    { text: "Close", style: "cancel" },
    {
      text: "Open settings",
      onPress: () => {
        void Linking.openSettings().catch(() => undefined);
      },
    },
  ]);
  return false;
}

export async function requestMicrophonePermission(
  title: string,
  message: string,
  deniedMessage: string
): Promise<boolean> {
  void title;
  void message;
  void deniedMessage;
  return true;
}

export async function requestNotificationPermission(
  title: string,
  message: string,
  deniedMessage: string
): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  if (Platform.Version < 33) {
    return true;
  }

  const permission = PermissionsAndroid?.PERMISSIONS?.POST_NOTIFICATIONS;
  if (!permission) {
    return true;
  }

  return requestAndroidPermission(permission, title, message, deniedMessage);
}
