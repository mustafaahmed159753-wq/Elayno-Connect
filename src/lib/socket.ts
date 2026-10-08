import { io, Socket } from "socket.io-client";

// Initialize Socket.IO instance pointing to same origin
export const socket: Socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
