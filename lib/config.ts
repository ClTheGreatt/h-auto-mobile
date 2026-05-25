// lib/config.ts
import Constants from "expo-constants";

/**
 * API base URL for talking to the Next.js backend.
 *
 * For DEVELOPMENT: replace with your laptop's LAN IP
 *   - On laptop, run: ipconfig (Windows) → look for IPv4 Address
 *   - Example: "http://192.168.1.42:3000"
 *   - Phone must be on the SAME Wi-Fi
 *
 * For PRODUCTION: replace with your deployed URL
 *   - Example: "https://h-auto.vercel.app"
 */
const DEV_API_URL = "http://192.168.1.54:3000"; // ⚠️ CHANGE THIS
const PROD_API_URL = "https://h-auto-pearl.vercel.app"; // ⚠️ CHANGE THIS when deployed

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const SESSION_DURATION_DAYS = 30;

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
