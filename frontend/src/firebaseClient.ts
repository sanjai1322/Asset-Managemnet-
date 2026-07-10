import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken, isSupported } from "firebase/messaging";
import api from "./api";

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let messaging: any = null;

// Initialize Firebase only if the browser supports it
const initFirebase = async () => {
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      const app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.warn("Firebase Messaging is not supported or failed to initialize:", error);
  }
  return null;
};

export const registerFirebaseToken = async () => {
  try {
    const msg = await initFirebase();
    if (!msg) {
      console.log("Push notifications not supported by browser.");
      return;
    }

    // Request permission explicitly
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(msg, {
        vapidKey: "YOUR_VAPID_KEY_HERE" // Replace with actual VAPID key
      });

      if (currentToken) {
        // Send token to backend
        await api.post('/users/fcm-token', { token: currentToken });
        console.log("FCM token registered with backend.");
      } else {
        console.log("No registration token available.");
      }
    } else {
      console.log("Notification permission not granted.");
    }
  } catch (err) {
    console.error("An error occurred while retrieving token.", err);
  }
};

export const unregisterFirebaseToken = async () => {
  try {
    const msg = await initFirebase();
    if (!msg) return;

    // We can't easily get the old token without the VAPID key again if we didn't store it,
    // but we can try to retrieve the current one and delete it from backend.
    const currentToken = await getToken(msg, {
      vapidKey: "YOUR_VAPID_KEY_HERE"
    });
    
    if (currentToken) {
      await api.delete('/users/fcm-token', { data: { token: currentToken } });
      await deleteToken(msg);
      console.log("FCM token unregistered from backend.");
    }
  } catch (err) {
    console.error("Error unregistering FCM token:", err);
  }
};
