// lib/config.ts
import Constants from "expo-constants";

// Production custom domain (Cloudflare DNS), matching the web app's
// deployed host. A cloud build bakes this in unconditionally whenever
// __DEV__ === false (any non-development-client EAS profile).
// MUST be the canonical, non-redirecting host — verified with curl:
// https://h-auto.org (bare apex) 308-redirects to https://www.h-auto.org,
// even for POST /api routes. React Native's fetch does not reliably
// preserve the Authorization header or body across a redirect, so pointing
// this at a redirecting host silently breaks authenticated requests in
// release builds while working fine in dev (which hits a local server with
// no redirect at all). If the canonical host ever changes, verify with
// `curl -sI -X POST <host>/api/auth/mobile-login` that it returns a real
// response (400/401), not a 3xx, before changing this value.
const PROD_API_URL = "https://www.h-auto.org";

// Expo inlines EXPO_PUBLIC_* references into development bundles. Local/LAN
// testing remains explicit while a missing or blank override safely uses the
// canonical API. Release and preview bundles always ignore this override.
// Example: EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
const developmentApiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";

export const API_URL =
  __DEV__ && developmentApiUrl ? developmentApiUrl : PROD_API_URL;

export const SESSION_DURATION_DAYS = 30;

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
