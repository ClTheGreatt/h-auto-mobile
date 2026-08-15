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

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const SESSION_DURATION_DAYS = 30;

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
