// src/lib/socket.js
import { io } from "socket.io-client";
import { resolveApiOrigin } from "./endpoint";

/**
 * Dev: ws to http://localhost:5100
 * Prod: ws to https://www.avtradersagriclinic.com (same-origin)
 * If VITE_API_BASE_URL is set, we use its origin.
 */
const ORIGIN = resolveApiOrigin();
if (import.meta.env.DEV) console.log('[socket] origin =', ORIGIN);

export const socket = io(ORIGIN, {
  path: "/socket.io",
  withCredentials: true,
  transports: ["websocket", "polling"],
});
